import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// O kontrak aset anatomi (provenance-first) harus berupa JSON yang valid dan konsisten secara internal.
// Sebelumnya berkas ini tidak bisa di-parse (kurung kurawal kurang di dua kondisi allOf) sehingga tak ada
// yang menyadari kontraknya mati.
const path = 'data/anatomy/anatomy-asset.schema.json'
const schema = JSON.parse(readFileSync(path, 'utf8'))

assert.match(schema.$schema, /2020-12/, 'declares JSON Schema 2020-12')
assert.equal(schema.type, 'object')
assert.equal(schema.additionalProperties, false, 'unknown fields are rejected (fail closed)')
for (const key of schema.required as string[]) assert.ok(key in schema.properties, `required key "${key}" is defined in properties`)
for (const k of ['source', 'license', 'validation', 'productionGate']) assert.ok((schema.required as string[]).includes(k), `${k} is mandatory in every asset record`)

// Aturan kondisional: setiap allOf punya if+then, dan dua aturan keselamatan ada.
assert.ok(Array.isArray(schema.allOf) && schema.allOf.length >= 2, 'conditional rules are present')
for (const [i, rule] of (schema.allOf as any[]).entries()) {
  assert.ok(rule.if && rule.then, `allOf[${i}] has both if and then`)
}
const blocked = (schema.allOf as any[]).find((r) => r.if?.properties?.license?.properties?.status?.const === 'BLOCKED')
assert.ok(blocked, 'a BLOCKED licence rule exists')
assert.equal(blocked.then.properties.runtime.properties.enabled.const, false, 'a BLOCKED licence forces runtime.enabled = false')
const patient = (schema.allOf as any[]).find((r) => r.if?.properties?.classification?.const === 'PATIENT_SPECIFIC')
assert.ok(patient, 'a PATIENT_SPECIFIC rule exists')
assert.equal(patient.then.properties.validation.properties.patientSpecific.const, true, 'PATIENT_SPECIFIC requires patient-specific validation')
console.log('Anatomy asset schema verified: valid JSON, fail-closed, BLOCKED licence disables runtime, patient-specific requires validation.')
