import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { cleanBodyBiomedicalQuery, unmappedAnatomy } from '../src/bodyBiomedicalCoverage.js'

assert.equal(cleanBodyBiomedicalQuery('  Parkinson\n disease  '), 'Parkinson disease')
assert.equal(cleanBodyBiomedicalQuery('<script>TB</script>'), 'script TB /script')
assert.equal(cleanBodyBiomedicalQuery('x'.repeat(300)).length, 160)
assert.deepEqual(unmappedAnatomy(), { status: 'unmapped', organKeys: [] })

const source = readFileSync(new URL('../src/bodyBiomedicalCoverage.ts', import.meta.url), 'utf8')

// No giant bundled catalog and no broad all-source fan-out: each explicit kind
// goes through the already-hardened canonical server adapter.
assert.match(source, /cariDiagnosis\(query, MAX_DIAGNOSIS_RESULTS\)/)
assert.match(source, /lookupDrugLabel\(query\)/)
assert.match(source, /lookupGene\(query\)/)
assert.match(source, /MAX_DIAGNOSIS_RESULTS = 20/)
assert.doesNotMatch(source, /Promise\.all\s*\(/)

// Scientific fail-closed rule: this foundation must not infer Z-Anatomy sites
// from free text. Anatomy gets attached only by a later curated/provenanced map.
assert.match(source, /anatomy: unmappedAnatomy\(\)/g)
assert.doesNotMatch(source, /includes\(.*heart|includes\(.*brain|includes\(.*kidney/i)

// Preserve source identity and ICD release rather than relabeling fallback data.
assert.match(source, /WHO ICD-11 MMS \$\{icd11Release\}/)
assert.match(source, /NLM Clinical Tables ICD-10-CM fallback/)
assert.match(source, /openFDA Structured Product Label/)
assert.match(source, /MyGene\.info human gene annotation/)

console.log('body biomedical coverage boundary: ok')
