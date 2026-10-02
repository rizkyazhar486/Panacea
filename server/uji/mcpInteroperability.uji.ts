// Uji RED/GREEN MCP Phase B — interoperability preview saja.
// Tidak ada panggilan jaringan atau data pasien persisten di berkas ini.

import {
  buildObservationBundlePreview,
  buildSatusehatPreview,
  hl7v2ToFhirPreview,
  inspectFhirResource,
  parseHl7v2Preview,
} from '../src/mcp/interoperability.js'
import { createPanaceaToolRegistry } from '../src/mcp/registry.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const registryNames = new Set(createPanaceaToolRegistry().map((tool) => tool.name))
for (const nama of [
  'panacea_fhir_capabilities',
  'panacea_fhir_build_observation_bundle_preview',
  'panacea_fhir_inspect_resource',
  'panacea_fhir_satusehat_preview',
  'panacea_hl7v2_parse_preview',
  'panacea_hl7v2_to_fhir_preview',
]) {
  ok(`registry memuat ${nama}`, registryNames.has(nama))
}

const inspected = inspectFhirResource({
  resourceType: 'Bundle',
  type: 'collection',
  entry: [{ resource: { resourceType: 'Patient' } }, { resource: { resourceType: 'Observation' } }],
})
ok('FHIR inspector mengenali Bundle', inspected.resourceType === 'Bundle')
ok('FHIR inspector menghitung entry', inspected.entryCount === 2)
ok('FHIR inspector bukan full validator', inspected.fullValidator === false)

let invalidFhir = false
try {
  inspectFhirResource({ resourceType: '../Patient' })
} catch (error) {
  invalidFhir = error instanceof Error && error.message.includes('resourceType')
}
ok('FHIR inspector menolak resourceType tidak aman', invalidFhir)

const observationBundle = buildObservationBundlePreview({
  patient: { name: 'Example Person', sex: 'F', birthDate: '1990-01-02' },
  observedAt: '2026-09-17T00:00:00.000Z',
  values: {
    weightKg: 62.5,
    systolic: 118,
    heartRate: 70,
    phenoAge: 41.2,
    unknownMetric: 123,
    alt: Number.NaN,
  },
})
const observationResources = observationBundle.entry
  .map((entry) => entry.resource)
  .filter((resource) => resource.resourceType === 'Observation')
ok('observation preview hanya mengekspor nilai finite dikenal', observationResources.length === 4)
const weight = observationResources.find((resource) => resource.code?.coding?.[0]?.code === '29463-7')
ok('weight memakai LOINC terverifikasi', weight?.code?.coding?.[0]?.system === 'http://loinc.org')
const pheno = observationResources.find((resource) => resource.code?.coding?.[0]?.code === 'phenoAge')
ok('derived metric tetap local-code', pheno?.code?.coding?.[0]?.system === 'https://panaceamed.id/fhir/CodeSystem/derived')

const satusehat = buildSatusehatPreview({
  patient: { name: 'Example Person', mrn: 'MR-1', sex: 'F', dob: '1990-01-02' },
  record: {
    vitals: [
      { label: 'Heart rate', value: 72, unit: '/min', at: '2026-09-17T00:00:00.000Z' },
      { label: 'Missing', value: Number.NaN, unit: 'x' },
    ],
  },
  practitionerName: 'Example Clinician',
  now: '2026-09-17T00:00:00.000Z',
  uuids: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'],
})
ok('SATUSEHAT MCP menghasilkan preview transaction bundle', satusehat.bundle.resourceType === 'Bundle' && satusehat.bundle.type === 'transaction')
ok('SATUSEHAT preview tidak mengubah NaN menjadi nol', satusehat.summary.observations === 1)
ok('SATUSEHAT preview menyatakan network submission false', satusehat.networkSubmission === false)

const customHl7 = [
  'MSH*^~\\&*LAB*HOSP*PANACEA*CLINIC*20260917080000**ORU^R01*MSG-1*P*2.5',
  'PID*1**MR123^^^HOSP^MR**DOE^JANE****19900102*F',
  'OBR*1***PANEL^Example panel^L',
  'OBX*1*NM*8867-4^Heart rate^LN**72*/min^beats/min^UCUM',
  'OBX*2*ST*LOCAL-1^Narrative^99LOCAL**present',
].join('\r')

const parsed = parseHl7v2Preview(customHl7)
ok('HL7 menghormati custom field separator MSH-1', parsed.separators.field === '*')
ok('HL7 membaca encoding chars MSH-2', parsed.separators.component === '^' && parsed.separators.repetition === '~')
ok('HL7 membatasi diri pada segment preview yang didukung', parsed.segments.some((segment) => segment.type === 'OBX'))

const converted = hl7v2ToFhirPreview(customHl7)
ok('HL7→FHIR membuat Patient preview', converted.bundle.entry.some((entry) => entry.resource.resourceType === 'Patient'))
const convertedObs = converted.bundle.entry
  .map((entry) => entry.resource)
  .filter((resource) => resource.resourceType === 'Observation')
ok('HL7→FHIR membuat dua Observation preview', convertedObs.length === 2)
ok('LN eksplisit dipertahankan sebagai LOINC', convertedObs[0]?.code?.coding?.[0]?.system === 'http://loinc.org')
ok('coding system tidak dikenal tidak ditebak sebagai LOINC', converted.unmapped.some((item) => item.codeSystem === '99LOCAL' && item.code === 'LOCAL-1'))

let oversizedRejected = false
try {
  parseHl7v2Preview(`MSH|^~\\&|A|B|C|D|20260917||ORU^R01|1|P|2.5\rOBX|1|ST|X||${'x'.repeat(140 * 1024)}`)
} catch (error) {
  oversizedRejected = error instanceof Error && error.message.includes('too large')
}
ok('HL7 terlalu besar ditolak deterministik', oversizedRejected)

let malformedRejected = false
try {
  parseHl7v2Preview('PID|1||MR123')
} catch (error) {
  malformedRejected = error instanceof Error && error.message.includes('MSH')
}
ok('HL7 tanpa MSH pertama ditolak', malformedRejected)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
