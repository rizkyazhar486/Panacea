import {
  cariDiagnosis,
  icd11Release,
  rincianIcd11,
  type IcdEntry,
} from '../icd11.js'
import {
  ATC_DDD_SOURCE,
  ATC_DDD_VERSION,
  isPlausibleAtcCode,
} from '../atcDdd.js'
import { resolveRxNormConcept, type RxNormConcept } from '../rxnorm.js'
import {
  LOCAL_DERIVED_SYSTEM,
  LOINC_SYSTEM,
  searchVerifiedMetricTerms,
  verifiedMetricBySystemCode,
} from './verifiedTerminologyRegistry.js'

const ICD11_SYSTEM = 'https://id.who.int/icd/release/11/mms'
const ICD10CM_SYSTEM = 'http://hl7.org/fhir/sid/icd-10-cm'
const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm'
const ATC_SYSTEM = ATC_DDD_SOURCE.searchableIndex
const MAX_QUERY = 160
const MAX_RESULTS = 50

export type TerminologyProvider = 'icd' | 'rxnorm' | 'atc' | 'loinc'

export interface TerminologyResult {
  system: string
  code: string
  display: string
  provider: string
  version: string
  source: string
  matchMode: 'provider-search' | 'entity-resolve' | 'verified-registry' | 'structural-recognition' | 'identity-verified'
  sourceIdentity?: string
}

export interface TerminologySearchInput {
  provider: TerminologyProvider
  query: string
  limit?: number
}

export interface TerminologyResolveInput {
  provider: TerminologyProvider
  code: string
}

export interface TerminologyDependencies {
  searchIcd?: (query: string, limit?: number) => Promise<IcdEntry[]>
  resolveIcd?: (entityId: string) => Promise<IcdEntry | null>
  resolveRxNorm?: (queryOrRxcui: string) => Promise<RxNormConcept | null>
}

export interface TerminologyCrosswalkInput {
  source: {
    system: string
    code: string
    display?: string
  }
  targetSystem: string
}

function clean(value: unknown, max = MAX_QUERY): string {
  return typeof value === 'string'
    ? value.replace(/[<>\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : ''
}

function provider(value: unknown): TerminologyProvider {
  if (value === 'icd' || value === 'rxnorm' || value === 'atc' || value === 'loinc') return value
  throw new Error('provider must be one of: icd, rxnorm, atc, loinc')
}

function boundedLimit(value: unknown): number {
  if (value === undefined) return 20
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('limit must be a finite number')
  return Math.min(Math.max(Math.trunc(value), 1), MAX_RESULTS)
}

function rxResult(concept: RxNormConcept, matchMode: TerminologyResult['matchMode']): TerminologyResult {
  return {
    system: RXNORM_SYSTEM,
    code: concept.rxcui,
    display: concept.name,
    provider: 'NLM RxNorm',
    version: 'live',
    source: 'https://rxnav.nlm.nih.gov/',
    matchMode,
    sourceIdentity: 'RxCUI',
  }
}

export function normalizeIcdEntries(entries: readonly IcdEntry[]): TerminologyResult[] {
  return entries
    .filter((entry) => clean(entry.code, 128) && clean(entry.title, 500))
    .map((entry) => {
      if (entry.sumber === 'icd11') {
        return {
          system: ICD11_SYSTEM,
          code: clean(entry.code, 128),
          display: clean(entry.title, 500),
          provider: 'WHO ICD API',
          version: icd11Release,
          source: entry.uri ?? 'https://icd.who.int/icdapi',
          matchMode: 'provider-search' as const,
          sourceIdentity: 'WHO ICD-11 MMS',
        }
      }
      return {
        system: ICD10CM_SYSTEM,
        code: clean(entry.code, 128),
        display: clean(entry.title, 500),
        provider: 'NLM Clinical Tables',
        version: 'provider-current',
        source: 'https://clinicaltables.nlm.nih.gov/',
        matchMode: 'provider-search' as const,
        sourceIdentity: 'ICD-10-CM fallback',
      }
    })
}

function atcResult(code: string): TerminologyResult {
  const normalized = code.trim().toUpperCase()
  return {
    system: ATC_SYSTEM,
    code: normalized,
    display: `ATC code ${normalized}`,
    provider: ATC_DDD_SOURCE.custodian,
    version: ATC_DDD_VERSION,
    source: ATC_DDD_SOURCE.searchableIndex,
    matchMode: 'structural-recognition',
    sourceIdentity: 'Explicit ATC code; no drug-name inference performed',
  }
}

function localRegistryResult(
  system: string,
  code: string,
  display: string,
): TerminologyResult {
  const local = system === LOCAL_DERIVED_SYSTEM
  return {
    system,
    code,
    display,
    provider: local ? 'Panaceamed verified derived-code registry' : 'Panaceamed verified LOINC registry',
    version: 'registry-2026-09',
    source: local
      ? LOCAL_DERIVED_SYSTEM
      : 'Panaceamed verified subset; underlying LOINC release is not asserted by this registry',
    matchMode: 'verified-registry',
    sourceIdentity: local ? 'Panaceamed derived metric' : 'LOINC code explicitly verified in Panaceamed FHIR export',
  }
}

function dependencies(input: TerminologyDependencies | undefined) {
  return {
    searchIcd: input?.searchIcd ?? cariDiagnosis,
    resolveIcd: input?.resolveIcd ?? rincianIcd11,
    resolveRxNorm: input?.resolveRxNorm ?? resolveRxNormConcept,
  }
}

export async function searchTerminology(
  input: TerminologySearchInput,
  injected?: TerminologyDependencies,
): Promise<{ provider: TerminologyProvider; results: TerminologyResult[]; warnings: string[] }> {
  const selected = provider(input.provider)
  const query = clean(input.query)
  const limit = boundedLimit(input.limit)
  if (!query) return { provider: selected, results: [], warnings: ['Blank terminology query was not sent upstream.'] }
  const deps = dependencies(injected)

  if (selected === 'icd') {
    const results = normalizeIcdEntries(await deps.searchIcd(query, limit)).slice(0, limit)
    return {
      provider: selected,
      results,
      warnings: results.some((item) => item.system === ICD10CM_SYSTEM)
        ? ['WHO ICD-11 was unavailable or returned no result; ICD-10-CM fallback identity is preserved explicitly.']
        : [],
    }
  }

  if (selected === 'rxnorm') {
    const concept = await deps.resolveRxNorm(query)
    return {
      provider: selected,
      results: concept ? [rxResult(concept, 'provider-search')] : [],
      warnings: ['RxNorm lookup is terminology normalization only; it does not establish therapeutic equivalence or interaction safety.'],
    }
  }

  if (selected === 'atc') {
    const normalized = query.toUpperCase()
    return {
      provider: selected,
      results: isPlausibleAtcCode(normalized) ? [atcResult(normalized)] : [],
      warnings: [
        'ATC search recognizes only explicit syntactically plausible ATC codes because no licensed bulk ATC catalogue is bundled.',
        'No ATC code is inferred from a free-text medicine name.',
      ],
    }
  }

  const results = searchVerifiedMetricTerms(query, limit).map((term) =>
    localRegistryResult(term.system, term.code, term.display),
  )
  return {
    provider: selected,
    results,
    warnings: ['LOINC search is limited to Panaceamed’s explicitly verified local registry; it is not a complete LOINC catalogue.'],
  }
}

export async function resolveTerminology(
  input: TerminologyResolveInput,
  injected?: TerminologyDependencies,
): Promise<{ status: 'resolved' | 'unmapped'; result?: TerminologyResult; warnings: string[] }> {
  const selected = provider(input.provider)
  const code = clean(input.code, 256)
  if (!code) return { status: 'unmapped', warnings: ['Blank terminology code is unmapped.'] }
  const deps = dependencies(injected)

  if (selected === 'loinc') {
    const exact =
      verifiedMetricBySystemCode(LOINC_SYSTEM, code)
      ?? verifiedMetricBySystemCode(LOCAL_DERIVED_SYSTEM, code)
    return exact
      ? { status: 'resolved', result: localRegistryResult(exact.system, exact.code, exact.display), warnings: [] }
      : {
          status: 'unmapped',
          warnings: ['Code is not present in the verified Panaceamed LOINC/derived registry; no mapping was guessed.'],
        }
  }

  if (selected === 'atc') {
    return isPlausibleAtcCode(code)
      ? {
          status: 'resolved',
          result: atcResult(code),
          warnings: ['Structural recognition only; this does not assert ingredient identity, indication, DDD, or prescribing dose.'],
        }
      : { status: 'unmapped', warnings: ['Code is not structurally plausible as ATC; no mapping was guessed.'] }
  }

  if (selected === 'rxnorm') {
    const concept = await deps.resolveRxNorm(code)
    return concept
      ? {
          status: 'resolved',
          result: rxResult(concept, 'entity-resolve'),
          warnings: ['RxCUI/name resolution is terminology reference only.'],
        }
      : { status: 'unmapped', warnings: ['RxNorm did not resolve the supplied value.'] }
  }

  const looksLikeEntity = /^\d+$/.test(code) || /^https:\/\/id\.who\.int\/icd\/entity\/\d+\/?$/.test(code)
  if (looksLikeEntity) {
    const detail = await deps.resolveIcd(code)
    if (detail) {
      const normalized = normalizeIcdEntries([detail])[0]
      if (normalized) return {
        status: 'resolved',
        result: { ...normalized, matchMode: 'entity-resolve' },
        warnings: [],
      }
    }
  }

  const candidates = normalizeIcdEntries(await deps.searchIcd(code, 20))
  const exact = candidates.find((item) => item.code.toLocaleUpperCase('en-US') === code.toLocaleUpperCase('en-US'))
  return exact
    ? { status: 'resolved', result: { ...exact, matchMode: 'entity-resolve' }, warnings: [] }
    : { status: 'unmapped', warnings: ['ICD code/entity was not verified; no ICD crosswalk was guessed.'] }
}

export function crosswalkTerminologyPreview(input: TerminologyCrosswalkInput) {
  const sourceSystem = clean(input.source?.system, 300)
  const sourceCode = clean(input.source?.code, 256)
  const sourceDisplay = clean(input.source?.display, 500) || undefined
  const targetSystem = clean(input.targetSystem, 300)

  const source = { system: sourceSystem, code: sourceCode, display: sourceDisplay }
  if (!sourceSystem || !sourceCode || !targetSystem) {
    return {
      status: 'unmapped' as const,
      source,
      targetSystem,
      warning: 'Source system/code and target system are required; no mapping was guessed.',
    }
  }

  if (sourceSystem === targetSystem) {
    const known = verifiedMetricBySystemCode(sourceSystem, sourceCode)
    if (known) {
      return {
        status: 'verified' as const,
        source,
        targetSystem,
        target: {
          system: sourceSystem,
          code: sourceCode,
          display: sourceDisplay ?? known.display,
        },
        relationship: 'identity',
        provenance: 'Panaceamed verified terminology registry',
      }
    }
  }

  return {
    status: 'unmapped' as const,
    source,
    targetSystem,
    warning: 'No explicit verified relationship is encoded in Panaceamed; crosswalk remains unmapped.',
  }
}

export function terminologyMcpCapabilities() {
  return {
    providers: ['icd', 'rxnorm', 'atc', 'loinc'] as const,
    snomedCt: {
      supported: false,
      reason: 'No authorized/licensed SNOMED CT terminology service is configured in this MCP domain.',
    },
    guessedCrosswalks: false,
    patientSpecificClinicalDecision: false,
  }
}
