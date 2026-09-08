import { readFile, writeFile } from 'node:fs/promises'

async function edit(path, transform) {
  const before = await readFile(path, 'utf8')
  const after = transform(before)
  if (after === before) throw new Error(`Guarded patch made no change: ${path}`)
  await writeFile(path, after)
  console.log(`patched ${path}`)
}

await edit('data/source-registry/source.schema.json', (source) => {
  const old = '        "module": { "type": ["string", "null"] },'
  const next = `        "module": {\n          "oneOf": [\n            { "type": "string", "minLength": 1 },\n            { "type": "null" },\n            {\n              "type": "array",\n              "minItems": 1,\n              "uniqueItems": true,\n              "items": { "type": "string", "minLength": 1 }\n            }\n          ]\n        },`
  if (!source.includes(old)) throw new Error('source.schema.json adapter.module anchor not found')
  return source.replace(old, next)
})

await edit('scripts/validate-source-registry.mjs', (source) => {
  const start = `function validateActiveAdapterModule(modulePath, relativeRegistryPath) {\n  const errors = [];\n  if (typeof modulePath !== 'string' || !modulePath.trim()) return errors;\n`
  const replacement = `function validateActiveAdapterModule(modulePath, relativeRegistryPath) {\n  const errors = [];\n\n  if (Array.isArray(modulePath)) {\n    for (const pathEntry of modulePath) {\n      errors.push(...validateActiveAdapterModule(pathEntry, relativeRegistryPath));\n    }\n    return errors;\n  }\n\n  if (typeof modulePath !== 'string' || !modulePath.trim()) return errors;\n`
  if (!source.includes(start)) throw new Error('validateActiveAdapterModule anchor not found')
  return source.replace(start, replacement)
})

await edit('data/source-registry/terminology/embl-ebi-ols4.json', (source) => {
  const old = '    "module": "src/lib/medicalSources.ts + server/src/anatomyOntology.ts",'
  const next = '    "module": ["src/lib/medicalSources.ts", "server/src/anatomyOntology.ts"],'
  if (!source.includes(old)) throw new Error('OLS4 combined module anchor not found')
  return source.replace(old, next)
})

await edit('scripts/qa/source-registry-validator.test.mjs', (source) => {
  const acceptAnchor = `test('accepts ACTIVE adapter whose repository-relative module is a real file', async () => {\n  const result = await runFixture([\n    {\n      filename: 'active-existing-module.json',\n      entry: activeEntry('scripts/validate-source-registry.mjs'),\n    },\n  ])\n  assert.equal(result.status, 0, result.stderr)\n})\n`
  const acceptNext = `${acceptAnchor}\ntest('accepts ACTIVE adapter with multiple real repository-relative modules', async () => {\n  const result = await runFixture([\n    {\n      filename: 'active-multiple-modules.json',\n      entry: activeEntry(['scripts/validate-source-registry.mjs', 'scripts/qa/source-registry-validator.test.mjs']),\n    },\n  ])\n  assert.equal(result.status, 0, result.stderr)\n})\n`
  if (!source.includes(acceptAnchor)) throw new Error('source registry acceptance test anchor not found')
  source = source.replace(acceptAnchor, acceptNext)

  const missingAnchor = `test('rejects ACTIVE adapter whose module file does not exist', async () => {\n  const result = await runFixture([\n    {\n      filename: 'active-missing-module.json',\n      entry: activeEntry('server/src/definitely-not-a-panacea-adapter.ts'),\n    },\n  ])\n  assert.notEqual(result.status, 0)\n  assert.match(result.stderr, /ACTIVE adapter\\.module does not exist/)\n})\n`
  const missingNext = `${missingAnchor}\ntest('rejects ACTIVE adapter module array when any module is missing', async () => {\n  const result = await runFixture([\n    {\n      filename: 'active-partially-missing-modules.json',\n      entry: activeEntry(['scripts/validate-source-registry.mjs', 'server/src/definitely-not-a-panacea-adapter.ts']),\n    },\n  ])\n  assert.notEqual(result.status, 0)\n  assert.match(result.stderr, /ACTIVE adapter\\.module does not exist/)\n})\n`
  if (!source.includes(missingAnchor)) throw new Error('source registry missing-module test anchor not found')
  return source.replace(missingAnchor, missingNext)
})

console.log('Strict multi-adapter Source Registry patch applied.')
