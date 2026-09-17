// Uji RED/GREEN MCP Phase B — terminology normalization fail-closed.
// Uji ini memakai dependency injection agar tidak bergantung pada jaringan.

import {
  crosswalkTerminologyPreview,
  normalizeIcdEntries,
  resolveTerminology,
  searchTerminology,
} from '../src/mcp/terminology.js'
import { createPanaceaToolRegistry } from '../src/mcp/registry.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const registryNames = new Set(createPanaceaToolRegistry().map((tool) => tool.name))
for (const nama of [
  'panacea_terminology_search',
  'panacea_terminology_resolve',
  'panacea_terminology_crosswalk_preview',
]) {
  ok(`registry memuat ${nama}`, registryNames.has(nama))
}

const normalizedFallback = normalizeIcdEntries([
  { code: 'I10', title: 'Essential (primary) hypertension', sumber: 'icd10cm' },
])
ok('ICD-10-CM fallback tidak pernah dilabel ICD-11', normalizedFallback[0]?.system === 'http://hl7.org/fhir/sid/icd-10-cm')
ok('ICD fallback mempertahankan provider NLM', normalizedFallback[0]?.provider === 'NLM Clinical Tables')

const normalizedIcd11 = normalizeIcdEntries([
  { code: 'BA00', title: 'Essential hypertension', sumber: 'icd11', uri: 'https://id.who.int/icd/entity/123' },
])
ok('ICD-11 memakai system WHO ICD-11', normalizedIcd11[0]?.system === 'https://id.who.int/icd/release/11/mms')
ok('ICD-11 membawa release version', normalizedIcd11[0]?.version === '2026-01')

const loinc = await searchTerminology(
  { provider: 'loinc', query: 'body weight', limit: 5 },
  {
    searchIcd: async () => [],
    resolveRxNorm: async () => null,
  },
)
ok('LOINC search hanya memakai registry terverifikasi', loinc.results.some((item) => item.code === '29463-7' && item.system === 'http://loinc.org'))

const localDerived = await resolveTerminology(
  { provider: 'loinc', code: 'phenoAge' },
  {
    searchIcd: async () => [],
    resolveRxNorm: async () => null,
  },
)
ok('derived Panacea code bukan disamarkan sebagai LOINC', localDerived.status === 'resolved' && localDerived.result?.system === 'https://panaceamed.id/fhir/CodeSystem/derived')

const atc = await resolveTerminology(
  { provider: 'atc', code: 'C10AA05' },
  {
    searchIcd: async () => [],
    resolveRxNorm: async () => null,
  },
)
ok('ATC eksplisit yang plausible diakui sebagai reference code', atc.status === 'resolved' && atc.result?.system === 'https://atcddd.fhi.no/atc_ddd_index/')
ok('ATC result membawa version 2026', atc.result?.version === '2026')

const badAtc = await resolveTerminology(
  { provider: 'atc', code: 'NOT-ATC' },
  {
    searchIcd: async () => [],
    resolveRxNorm: async () => null,
  },
)
ok('ATC tidak plausible fail-closed unmapped', badAtc.status === 'unmapped')

const rx = await searchTerminology(
  { provider: 'rxnorm', query: 'acetaminophen', limit: 5 },
  {
    searchIcd: async () => [],
    resolveRxNorm: async () => ({ rxcui: '161', name: 'Acetaminophen' }),
  },
)
ok('RxNorm result mempertahankan RxCUI', rx.results[0]?.code === '161')
ok('RxNorm result mempertahankan NLM provider', rx.results[0]?.provider === 'NLM RxNorm')

const icdInjected = await searchTerminology(
  { provider: 'icd', query: 'hypertension', limit: 5 },
  {
    searchIcd: async () => [{ code: 'I10', title: 'Essential hypertension', sumber: 'icd10cm' }],
    resolveRxNorm: async () => null,
  },
)
ok('ICD dependency injection tetap menjaga fallback identity', icdInjected.results[0]?.system === 'http://hl7.org/fhir/sid/icd-10-cm')

const unknownCrosswalk = crosswalkTerminologyPreview({
  source: { system: 'urn:example:local', code: 'ABC', display: 'Example local term' },
  targetSystem: 'http://loinc.org',
})
ok('crosswalk unknown fail-closed', unknownCrosswalk.status === 'unmapped')
ok('crosswalk unknown mempertahankan source code', unknownCrosswalk.source.code === 'ABC')
ok('crosswalk tidak menghasilkan target code palsu', unknownCrosswalk.target === undefined)

const verifiedIdentity = crosswalkTerminologyPreview({
  source: { system: 'http://loinc.org', code: '29463-7', display: 'Body weight' },
  targetSystem: 'http://loinc.org',
})
ok('identity crosswalk terverifikasi hanya untuk registry dikenal', verifiedIdentity.status === 'verified' && verifiedIdentity.target?.code === '29463-7')

const fakeIdentity = crosswalkTerminologyPreview({
  source: { system: 'http://loinc.org', code: '99999-9', display: 'Unknown' },
  targetSystem: 'http://loinc.org',
})
ok('LOINC identity tidak dikenal tetap unmapped', fakeIdentity.status === 'unmapped')

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
