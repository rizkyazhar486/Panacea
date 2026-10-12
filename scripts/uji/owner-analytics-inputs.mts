import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateAbInput, validateSampleSizeInput, validateSeoNumbers, validateCustomerEntry } from '../../src/domains/owner-analytics/index.ts'

const ab = { controlVisitors: '4000', controlConversions: '200', variantVisitors: '4000', variantConversions: '232', plannedPerArm: '4000' }
const seo = { h1Count: '1', wordCount: '450', imagesTotal: '8', imagesWithAlt: '5', loadSeconds: '2.4', internalLinks: '6' }
const cust = { name: ' Ana ', daysSinceLastUse: '10', usesLast90Days: '3', totalSpend: '150.5' }
const probs = (r: { ok: boolean; problems?: string[] }) => (r.ok ? [] : r.problems ?? [])

// ── Positif
assert.deepEqual(validateAbInput(ab), { ok: true, value: { controlVisitors: 4000, controlConversions: 200, variantVisitors: 4000, variantConversions: 232, plannedPerArm: 4000 } })
assert.deepEqual(validateSampleSizeInput('5', '1'), { ok: true, value: { baselinePct: 5, mdePp: 1 } })
assert.deepEqual(validateSeoNumbers(seo), { ok: true, value: { h1Count: 1, wordCount: 450, imagesTotal: 8, imagesWithAlt: 5, loadSeconds: 2.4, internalLinks: 6 } })
assert.deepEqual(validateCustomerEntry(cust), { ok: true, value: { name: 'Ana', daysSinceLastUse: 10, usesLast90Days: 3, totalSpend: 150.5 } })
// 0 digitado explicitamente é uma decisão válida (≠ vazio)
assert.equal(validateAbInput({ ...ab, controlConversions: '0' }).ok, true)
assert.equal(validateCustomerEntry({ ...cust, totalSpend: '0', usesLast90Days: '0', daysSinceLastUse: '0' }).ok, true)
assert.equal(validateSeoNumbers({ ...seo, h1Count: '0', imagesTotal: '0', imagesWithAlt: '0', loadSeconds: '0' }).ok, true)

// ── Negativo: vazio / espaço / texto / NaN / Infinity → recusado, com o rótulo, sem `value`
const abCampos: [keyof typeof ab, string][] = [['controlVisitors', 'Control visitors'], ['controlConversions', 'Control conversions'], ['variantVisitors', 'Variant visitors'], ['variantConversions', 'Variant conversions'], ['plannedPerArm', 'Planned sample per group']]
for (const [k, label] of abCampos) for (const t of ['', '   ', 'abc', 'NaN', 'Infinity', '-Infinity']) {
  const r = validateAbInput({ ...ab, [k]: t })
  assert.equal(r.ok, false, `${k}=${JSON.stringify(t)}`)
  assert.ok(probs(r).some((m) => m.startsWith(`${label}:`)), `${k}=${JSON.stringify(t)} deve citar ${label}`)
  assert.equal('value' in r, false)
}
assert.deepEqual(probs(validateAbInput({ controlVisitors: '', controlConversions: '', variantVisitors: '', variantConversions: '', plannedPerArm: '' })).length, 5, 'todos os problemas de uma vez')
assert.deepEqual(probs(validateAbInput({ ...ab, controlConversions: '2.5' })), ['Control conversions: whole numbers only'])
assert.deepEqual(probs(validateAbInput({ ...ab, controlConversions: '-1' })), ['Control conversions: must be 0–1000000000'])
// Pareado: só a regra conversões ≤ visitantes difere
assert.equal(validateAbInput({ ...ab, controlConversions: '4000' }).ok, true)
assert.deepEqual(probs(validateAbInput({ ...ab, controlConversions: '4001' })), ['Control conversions: cannot exceed control visitors'])
assert.deepEqual(probs(validateAbInput({ ...ab, variantConversions: '4001' })), ['Variant conversions: cannot exceed variant visitors'])
// Limites: visitantes ≥ 1
assert.equal(validateAbInput({ ...ab, controlVisitors: '1', controlConversions: '1' }).ok, true)
assert.deepEqual(probs(validateAbInput({ ...ab, controlVisitors: '0', controlConversions: '0' })), ['Control visitors: must be 1–1000000000'])
assert.equal(validateAbInput({ ...ab, plannedPerArm: '1000000000' }).ok, true)
assert.equal(validateAbInput({ ...ab, plannedPerArm: '1000000001' }).ok, false)

// Tamanho de amostra
assert.equal(validateSampleSizeInput('0.01', '0.01').ok, true)
assert.equal(validateSampleSizeInput('99', '0.99').ok, true)
assert.deepEqual(probs(validateSampleSizeInput('99', '1')), ['Current conversion plus difference must stay below 100%'])
assert.deepEqual(probs(validateSampleSizeInput('0', '1')), ['Current conversion (%): must be 0.01–99.99'])
assert.deepEqual(probs(validateSampleSizeInput('5', '0')), ['Smallest meaningful difference (pp): must be 0.01–99.99'])
assert.deepEqual(probs(validateSampleSizeInput('', '')), ['Current conversion (%): enter a number', 'Smallest meaningful difference (pp): enter a number'])
assert.equal(validateSampleSizeInput('100', '1').ok, false)
assert.equal(validateSampleSizeInput('abc', '1').ok, false)

// SEO
for (const k of Object.keys(seo) as (keyof typeof seo)[]) for (const t of ['', '  ', 'abc', 'Infinity']) assert.equal(validateSeoNumbers({ ...seo, [k]: t }).ok, false, `${k}=${JSON.stringify(t)}`)
assert.deepEqual(probs(validateSeoNumbers({ ...seo, imagesWithAlt: '9' })), ['Images with alt: cannot exceed total images'])
assert.equal(validateSeoNumbers({ ...seo, imagesWithAlt: '8' }).ok, true)
assert.deepEqual(probs(validateSeoNumbers({ ...seo, h1Count: '1.5' })), ['H1 count: whole numbers only'])
assert.equal(validateSeoNumbers({ ...seo, loadSeconds: '600' }).ok, true)
assert.equal(validateSeoNumbers({ ...seo, loadSeconds: '600.01' }).ok, false)
assert.equal(validateSeoNumbers({ ...seo, loadSeconds: '-0.01' }).ok, false)

// Clientes
assert.deepEqual(probs(validateCustomerEntry({ ...cust, name: '   ' })), ['User name: required'])
assert.equal(validateCustomerEntry({ ...cust, name: 'x'.repeat(80) }).ok, true)
assert.deepEqual(probs(validateCustomerEntry({ ...cust, name: 'x'.repeat(81) })), ['User name: at most 80 characters'])
for (const k of ['daysSinceLastUse', 'usesLast90Days', 'totalSpend'] as const) for (const t of ['', '  ', 'abc', 'NaN', 'Infinity', '-1']) assert.equal(validateCustomerEntry({ ...cust, [k]: t }).ok, false, `${k}=${JSON.stringify(t)}`)
assert.deepEqual(probs(validateCustomerEntry({ ...cust, daysSinceLastUse: '36501' })), ['Days since last use: must be 0–36500'])
assert.equal(validateCustomerEntry({ ...cust, daysSinceLastUse: '36500' }).ok, true)
assert.deepEqual(probs(validateCustomerEntry({ ...cust, daysSinceLastUse: '1.5' })), ['Days since last use: whole numbers only'])
assert.equal(validateCustomerEntry({ name: '', daysSinceLastUse: '', usesLast90Days: '', totalSpend: '' }).ok, false)
assert.equal(probs(validateCustomerEntry({ name: '', daysSinceLastUse: '', usesLast90Days: '', totalSpend: '' })).length, 4)
// Entrada de tipo errado não lança
for (const bad of [undefined, null, 5, {}] as unknown[]) {
  assert.equal(validateAbInput(bad as never).ok, false)
  assert.equal(validateSeoNumbers(bad as never).ok, false)
  assert.equal(validateCustomerEntry(bad as never).ok, false)
}

// Determinismo
assert.deepEqual(validateAbInput(ab), validateAbInput({ ...ab }))

// ── Regressão da página: sem `|| 0`, sem números de exemplo, usa o domínio
const pagina = readFileSync(new URL('../../src/pages/OwnerAnalytics.tsx', import.meta.url), 'utf8')
assert.equal(/\|\|\s*0\b/.test(pagina), false, 'a página não pode voltar a ler campo vazio como 0')
assert.equal(/useState\('(4000|200|232|5|1)'\)/.test(pagina), false, 'A/B não pode abrir com números de exemplo')
assert.equal(/wordCount:\s*450/.test(pagina), false, 'SEO não pode abrir com auditoria inventada')
for (const f of ['validateAbInput', 'validateSampleSizeInput', 'validateSeoNumbers', 'validateCustomerEntry']) assert.ok(pagina.includes(f), `página deve usar ${f}`)
assert.ok(pagina.includes('No audit yet') && pagina.includes('No result yet'), 'estados vazios explícitos')
console.log('owner-analytics-inputs: ok')
