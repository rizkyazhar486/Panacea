import { cariDiagnosis, icd11Release, type IcdEntry } from './icd11.js'
import { lookupDrugLabel, type DrugLabelInfo } from './drugInfo.js'
import { lookupGene, type GeneInfo } from './mygene.js'

/**
 * Server-side knowledge spine for Body Exposure.
 *
 * This module deliberately does NOT ship ICD/drug/gene catalogs to the browser.
 * It resolves one bounded query on demand and preserves source identity so the
 * Z-Anatomy client can highlight only anatomy mappings that are independently
 * verified. Missing mappings remain explicit `unmapped` states; this resolver
 * never guesses an organ from a diagnosis, drug name, mechanism, or gene.
 */

export type BodyBiomedicalKind = 'diagnosis' | 'drug' | 'gene'
export type AnatomyMappingStatus = 'verified' | 'unmapped'

export interface AnatomyAnchor {
  status: AnatomyMappingStatus
  organKeys: string[]
  /** Human-readable mapping provenance when a curated mapping is supplied. */
  provenance?: string
}

export interface BodyBiomedicalSource {
  id: 'who-icd11' | 'nlm-icd10cm' | 'openfda-spl' | 'mygene'
  version?: string
  label: string
}

export interface BodyDiagnosisResult {
  kind: 'diagnosis'
  query: string
  items: Array<{
    code: string
    title: string
    definition?: string
    uri?: string
    source: BodyBiomedicalSource
    anatomy: AnatomyAnchor
  }>
}

export interface BodyDrugResult {
  kind: 'drug'
  query: string
  item: null | {
    brandName: string
    genericName: string
    purpose: string
    mechanismOfAction: string
    adverseReactions: string
    warnings: string
    dosage: string
    indications: string
    labelId?: string
    sourceUrl?: string
    source: BodyBiomedicalSource
    anatomy: AnatomyAnchor
  }
}

export interface BodyGeneResult {
  kind: 'gene'
  query: string
  item: null | {
    symbol: string
    name: string
    summary: string
    aliases: string[]
    type: string
    chromosome: string
    location: string
    entrezId: string
    ensemblId: string
    source: BodyBiomedicalSource
    anatomy: AnatomyAnchor
  }
}

export type BodyBiomedicalResult = BodyDiagnosisResult | BodyDrugResult | BodyGeneResult

const MAX_QUERY_LENGTH = 160
const MAX_DIAGNOSIS_RESULTS = 20

export function cleanBodyBiomedicalQuery(value: string): string {
  return value
    .replace(/[<>\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
}

export function unmappedAnatomy(): AnatomyAnchor {
  return { status: 'unmapped', organKeys: [] }
}

function diagnosisSource(entry: IcdEntry): BodyBiomedicalSource {
  return entry.sumber === 'icd11'
    ? { id: 'who-icd11', version: icd11Release, label: `WHO ICD-11 MMS ${icd11Release}` }
    : { id: 'nlm-icd10cm', label: 'NLM Clinical Tables ICD-10-CM fallback' }
}

function mapDiagnosis(entry: IcdEntry) {
  return {
    code: entry.code,
    title: entry.title,
    definition: entry.definition,
    uri: entry.uri,
    source: diagnosisSource(entry),
    anatomy: unmappedAnatomy(),
  }
}

function mapDrug(drug: DrugLabelInfo): NonNullable<BodyDrugResult['item']> {
  return {
    ...drug,
    source: { id: 'openfda-spl', label: 'openFDA Structured Product Label' },
    anatomy: unmappedAnatomy(),
  }
}

function mapGene(gene: GeneInfo): NonNullable<BodyGeneResult['item']> {
  return {
    ...gene,
    source: { id: 'mygene', label: 'MyGene.info human gene annotation' },
    anatomy: unmappedAnatomy(),
  }
}

/**
 * Resolve exactly one entity family per request. This avoids the expensive and
 * ambiguous pattern of fan-out querying every biomedical upstream on each key
 * stroke. Frontend callers should debounce explicit submissions and request
 * only the selected kind.
 */
export async function resolveBodyBiomedical(
  kind: BodyBiomedicalKind,
  rawQuery: string,
): Promise<BodyBiomedicalResult> {
  const query = cleanBodyBiomedicalQuery(rawQuery)

  if (!query) {
    if (kind === 'diagnosis') return { kind, query: '', items: [] }
    return { kind, query: '', item: null }
  }

  if (kind === 'diagnosis') {
    const entries = await cariDiagnosis(query, MAX_DIAGNOSIS_RESULTS)
    return { kind, query, items: entries.slice(0, MAX_DIAGNOSIS_RESULTS).map(mapDiagnosis) }
  }

  if (kind === 'drug') {
    const drug = await lookupDrugLabel(query)
    return { kind, query, item: drug ? mapDrug(drug) : null }
  }

  const gene = await lookupGene(query)
  return { kind, query, item: gene ? mapGene(gene) : null }
}
