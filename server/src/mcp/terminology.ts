import { cariDiagnosis, icd11Release, rincianIcd11, type IcdEntry } from '../icd11.js'
import { ATC_DDD_SOURCE, ATC_DDD_VERSION, isPlausibleAtcCode } from '../atcDdd.js'
import { resolveRxNormConcept, type RxNormConcept } from '../rxnorm.js'

export type TerminologyProvider = 'icd' | 'rxnorm' | 'atc' | 'loinc'

export interface TerminologyResult {
  system: string
  code: string
  display: string
  provider: string
  version?: string
  source: string
  matchMode: 'exact' | 'search' | 'fallback' | 'structural'
  uri?: string
}

export interface TerminologyDependencies {
  searchIcd: (query: string, limit?: number) => Promise<IcdEntry[]>
  resolveRxNorm: (value: string) => Promise<RxNormConcept | null>
}

const LOINC_SYSTEM = 'http://loinc.org'
const PANACEA_DERIVED_SYSTEM = 'https://panaceamed.id/fhir/CodeSystem/derived'
const ATC_SYSTEM = 'https://atcddd.fhi.no/atc_ddd_index/'

const VERIFIED_LOCAL_TERMS: readonly TerminologyResult[] = [
  { system: LOINC_SYSTEM, code: '29463-7', display: 'Body weight', provider: 'Panaceamed verified LOINC registry', source: 'local-verified-registry', matchMode: 'exact' },
  { system: LOINC_SYSTEM, code: '8480-6', display: 'Systolic blood pressure', provider: 'Panaceamed verified LOINC registry', source: 'local-verified-registry', matchMode: 'exact' },
  { system: LOINC_SYSTEM, code: '8462-4', display: 'Diastolic blood pressure', provider: 'Panaceamed verified LOINC registry', source: 'local-verified-registry', matchMode: 'exact' },
  { system: LOINC_SYSTEM, code: '8867-4', display: 'Heart rate', provider: 'Panaceamed verified LOINC registry', source: 'local-verified-registry', matchMode: 'exact' },
  { system: LOINC_SYSTEM, code: '9279-1', display: 'Respiratory rate', provider: 'Panaceamed verified LOINC registry', source: 'local-verified-registry', matchMode: 'exact' },
  { system: LOINC_SYSTEM, code: '8310-5', display: 'Body temperature', provider: 'Panaceamed verified LOINC registry', source: 'local-verified-registry', matchMode: 'exact' },
  { system: LOINC_SYSTEM, code: '2708-6', display: 'Oxygen saturation in Arterial blood', provider: 'Panaceamed verified LOINC registry', source: 'local-verified-registry', matchMode: 'exact' },
  { system: PANACEA_DERIVED_SYSTEM, code: 'phenoAge', display: 'Phenotypic age', provider: 'Panaceamed derived metric registry', version: 'local', source: 'panaceamed-derived', matchMode: 'exact' },
]

const DEFAULT_DEPS: TerminologyDependencies = {
  searchIcd: cariDiagnosis,
  resolveRxNorm: resolveRxNormConcept,
}

function clean(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.replace(/[<>\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function boundedLimit(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 10
  return Math.max(1, Math.min(25, n))
}

export function normalizeIcdEntries(entries: readonly IcdEntry[]): TerminologyResult[] {
  return entries.map((entry) => entry.sumber === 'icd11'
    ? {
        system: 'https://id.who.int/icd/release/11/mms',
        code: entry.code,
        display: entry.title,
        provider: 'WHO ICD-11 MMS',
        version: icd11Release,
        source: 'WHO ICD API',
        matchMode: 'search' as const,
        uri: entry.uri,
      }
    : {
        system: 'http://hl7.org/fhir/sid/icd-10-cm',
        code: entry.code,
        display: entry.title,
        provider: 'NLM Clinical Tables',
        source: 'NLM ICD-10-CM Clinical Tables',
        matchMode: 'fallback' as const,
      })
}

function knownLocalByCode(code: string): TerminologyResult | undefined {
  const normalized = code.trim().toLowerCase()
  return VERIFIED_LOCAL_TERMS.find((entry) => entry.code.toLowerCase() === normalized)
}

function localSearch(query: string, limit: number): TerminologyResult[] {
  const normalized = query.toLowerCase()
  return VERIFIED_LOCAL_TERMS
    .filter((entry) => entry.code.toLowerCase() === normalized || entry.display.toLowerCase().includes(normalized))
    .slice(0, limit)
    .map((entry) => ({ ...entry, matchMode: entry.code.toLowerCase() === normalized ? 'exact' : 'search' }))
}

function rxNormResult(concept: RxNormConcept, mode: TerminologyResult['matchMode']): TerminologyResult {
  return {
    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
    code: concept.rxcui,
    display: concept.name,
    provider: 'NLM RxNorm',
    source: 'RxNav REST',
    matchMode: mode,
  }
}

export async function searchTerminology(
  input: { provider: TerminologyProvider; query: string; limit?: number },
  deps: TerminologyDependencies = DEFAULT_DEPS,
) {
  const query = clean(input.query)
  const limit = boundedLimit(input.limit)
  if (!query) return { provider: input.provider, results: [] as TerminologyResult[], warnings: ['Empty terminology query'] }

  if (input.provider === 'loinc') {
    return { provider: input.provider, results: localSearch(query, limit), warnings: [] }
  }
  if (input.provider === 'atc') {
    const code = query.toUpperCase()
    const results = isPlausibleAtcCode(code)
      ? [{ system: ATC_SYSTEM, code, display: code, provider: ATC_DDD_SOURCE.custodian, version: ATC_DDD_VERSION, source: ATC_DDD_SOURCE.citation, matchMode: 'structural' as const }]
      : []
    return { provider: input.provider, results, warnings: results.length ? ['ATC code is structurally plausible; this is not a bundled catalogue lookup.'] : ['Free-text ATC names are not guessed.'] }
  }
  if (input.provider === 'rxnorm') {
    const concept = await deps.resolveRxNorm(query)
    return { provider: input.provider, results: concept ? [rxNormResult(concept, 'search')] : [], warnings: [] }
  }
  if (input.provider === 'icd') {
    const entries = await deps.searchIcd(query, limit)
    return { provider: input.provider, results: normalizeIcdEntries(entries).slice(0, limit), warnings: [] }
  }
  return { provider: input.provider, results: [], warnings: ['Unsupported terminology provider'] }
}

export async function resolveTerminology(
  input: { provider: TerminologyProvider; code: string },
  deps: TerminologyDependencies = DEFAULT_DEPS,
): Promise<{ status: 'resolved' | 'unmapped'; result?: TerminologyResult; warnings?: string[] }> {
  const code = clean(input.code)
  if (!code) return { status: 'unmapped' }

  if (input.provider === 'loinc') {
    const local = knownLocalByCode(code)
    if (!local) return { status: 'unmapped' }
    return { status: 'resolved', result: { ...local, matchMode: 'exact' } }
  }

  if (input.provider === 'atc') {
    const atcCode = code.toUpperCase()
    if (!isPlausibleAtcCode(atcCode)) return { status: 'unmapped' }
    return {
      status: 'resolved',
      result: {
        system: ATC_SYSTEM,
        code: atcCode,
        display: atcCode,
        provider: ATC_DDD_SOURCE.custodian,
        version: ATC_DDD_VERSION,
        source: ATC_DDD_SOURCE.citation,
        matchMode: 'structural',
      },
      warnings: ['Structurally recognized ATC code only; no bundled catalogue display name or DDD is inferred.'],
    }
  }

  if (input.provider === 'rxnorm') {
    const concept = await deps.resolveRxNorm(code)
    return concept ? { status: 'resolved', result: rxNormResult(concept, 'exact') } : { status: 'unmapped' }
  }

  if (input.provider === 'icd') {
    if (/^\d+$/.test(code) || /^https:\/\/id\.who\.int\/icd\/entity\/\d+\/?$/.test(code)) {
      const entity = await rincianIcd11(code)
      if (entity) return { status: 'resolved', result: normalizeIcdEntries([entity])[0] }
    }
    const results = normalizeIcdEntries(await deps.searchIcd(code, 10))
    const exact = results.find((entry) => entry.code.toLowerCase() === code.toLowerCase())
    return exact ? { status: 'resolved', result: { ...exact, matchMode: 'exact' } } : { status: 'unmapped' }
  }

  return { status: 'unmapped' }
}

export function terminologyCapabilities() {
  return {
    providers: ['icd', 'rxnorm', 'atc', 'loinc'] as const,
    snomedCt: { supported: false as const, reason: 'No authorized/licensed SNOMED CT terminology provider is configured.' },
    crosswalks: 'fail-closed' as const,
    patientDatastoreRetrieval: false as const,
    clinicalMutation: false as const,
  }
}

export function crosswalkTerminologyPreview(input: {
  source: { system: string; code: string; display?: string }
  targetSystem: string
}) {
  const source = {
    system: clean(input.source?.system, 300),
    code: clean(input.source?.code, 160),
    display: clean(input.source?.display, 500) || undefined,
  }
  const targetSystem = clean(input.targetSystem, 300)
  if (!source.system || !source.code || !targetSystem) return { status: 'unmapped' as const, source, targetSystem }

  if (source.system === targetSystem) {
    const known = VERIFIED_LOCAL_TERMS.find((entry) => entry.system === source.system && entry.code.toLowerCase() === source.code.toLowerCase())
    if (known) {
      return {
        status: 'verified' as const,
        source,
        targetSystem,
        target: { system: known.system, code: known.code, display: known.display },
        provenance: known.source,
      }
    }
  }
  return { status: 'unmapped' as const, source, targetSystem }
}
