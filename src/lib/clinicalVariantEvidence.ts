import type { VcfVariantRecord } from './sequenceEvidence'

export interface ClinVarClassification {
  description: string
  reviewStatus: string
  lastEvaluated: string
  traits: string[]
}

export interface ClinVarSummary {
  uid: string
  accession: string
  accessionVersion: string
  title: string
  variantType: string
  genes: string[]
  proteinChange: string
  molecularConsequences: string[]
  germline?: ClinVarClassification
  clinicalImpact?: ClinVarClassification
  oncogenicity?: ClinVarClassification
  sourceQuery: string
}

export interface CpicGeneDrugPair {
  genesymbol: string
  drugname: string
  guidelinename?: string | null
  guidelineurl?: string | null
  cpiclevel?: string | null
  clinpgxlevel?: string | null
  pgxtesting?: string | null
  usedforrecommendation?: string | null
  provisional?: boolean | null
  pmids?: string[] | null
}

const CLINVAR_EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const CPIC_API = 'https://api.cpicpgx.org/v1'
const clinVarCache = new Map<string, Promise<ClinVarSummary[]>>()
const cpicCache = new Map<string, Promise<CpicGeneDrugPair[]>>()
let eutilsQueue: Promise<void> = Promise.resolve()
let lastEutilsStartedAt = 0

function normalizeChromosome(value: string) {
  return value.replace(/^chr/i, '')
}

function timeoutSignal(milliseconds: number) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), milliseconds)
  return { controller, clear: () => window.clearTimeout(timer) }
}

async function fetchJson<T>(url: string, milliseconds = 15000): Promise<T> {
  const { controller, clear } = timeoutSignal(milliseconds)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json() as T
  } finally {
    clear()
  }
}

function eutilsFetchJson<T>(url: string, milliseconds = 15000): Promise<T> {
  const task = eutilsQueue.then(async () => {
    const elapsed = Date.now() - lastEutilsStartedAt
    const wait = Math.max(0, 360 - elapsed)
    if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait))
    lastEutilsStartedAt = Date.now()
    return fetchJson<T>(url, milliseconds)
  })
  eutilsQueue = task.then(() => undefined, () => undefined)
  return task
}

function classification(raw: unknown): ClinVarClassification | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as Record<string, unknown>
  const description = typeof value.description === 'string' ? value.description : ''
  const reviewStatus = typeof value.review_status === 'string' ? value.review_status : ''
  const lastEvaluated = typeof value.last_evaluated === 'string' ? value.last_evaluated : ''
  const traitSet = Array.isArray(value.trait_set) ? value.trait_set : []
  const traits = traitSet
    .map((trait) => trait && typeof trait === 'object' && typeof (trait as Record<string, unknown>).trait_name === 'string' ? String((trait as Record<string, unknown>).trait_name) : '')
    .filter(Boolean)
  if (!description && !reviewStatus && !lastEvaluated && !traits.length) return undefined
  return { description, reviewStatus, lastEvaluated, traits: [...new Set(traits)] }
}

function summaryFromDoc(uid: string, raw: Record<string, unknown>, sourceQuery: string): ClinVarSummary {
  const genesRaw = Array.isArray(raw.genes) ? raw.genes : []
  const genes = genesRaw
    .map((gene) => gene && typeof gene === 'object' && typeof (gene as Record<string, unknown>).symbol === 'string' ? String((gene as Record<string, unknown>).symbol) : '')
    .filter(Boolean)
  const molecular = Array.isArray(raw.molecular_consequence_list)
    ? raw.molecular_consequence_list.filter((item): item is string => typeof item === 'string')
    : []

  return {
    uid,
    accession: typeof raw.accession === 'string' ? raw.accession : '',
    accessionVersion: typeof raw.accession_version === 'string' ? raw.accession_version : '',
    title: typeof raw.title === 'string' ? raw.title : 'ClinVar record',
    variantType: typeof raw.obj_type === 'string' ? raw.obj_type : '',
    genes: [...new Set(genes)],
    proteinChange: typeof raw.protein_change === 'string' ? raw.protein_change : '',
    molecularConsequences: [...new Set(molecular)],
    germline: classification(raw.germline_classification),
    clinicalImpact: classification(raw.clinical_impact_classification),
    oncogenicity: classification(raw.oncogenicity_classification),
    sourceQuery,
  }
}

function clinVarQuery(variant: VcfVariantRecord, assembly: 'GRCh37' | 'GRCh38', externalId?: string) {
  const rsId = [externalId, variant.id].find((value) => value && /^rs\d+$/i.test(value))
  if (rsId) return rsId
  return `${normalizeChromosome(variant.chrom)}:${variant.pos}:${variant.ref}:${variant.alt}(${assembly})`
}

export function fetchClinVarForVariant(
  variant: VcfVariantRecord,
  assembly: 'GRCh37' | 'GRCh38',
  externalId?: string,
): Promise<ClinVarSummary[]> {
  const query = clinVarQuery(variant, assembly, externalId)
  const cacheKey = `${assembly}|${query}`
  const cached = clinVarCache.get(cacheKey)
  if (cached) return cached

  const promise = (async () => {
    const searchUrl = `${CLINVAR_EUTILS}/esearch.fcgi?db=clinvar&retmode=json&retmax=3&tool=PanaceaMed&term=${encodeURIComponent(query)}`
    const search = await eutilsFetchJson<{ esearchresult?: { idlist?: string[] } }>(searchUrl)
    const ids = search.esearchresult?.idlist || []
    if (!ids.length) return []

    const summaryUrl = `${CLINVAR_EUTILS}/esummary.fcgi?db=clinvar&retmode=json&tool=PanaceaMed&id=${encodeURIComponent(ids.join(','))}`
    const payload = await eutilsFetchJson<{ result?: Record<string, unknown> & { uids?: string[] } }>(summaryUrl)
    const result = payload.result || {}
    const orderedIds = Array.isArray(result.uids) ? result.uids : ids
    return orderedIds
      .map((uid) => {
        const raw = result[uid]
        return raw && typeof raw === 'object' ? summaryFromDoc(uid, raw as Record<string, unknown>, query) : null
      })
      .filter((item): item is ClinVarSummary => Boolean(item))
  })().catch((error) => {
    clinVarCache.delete(cacheKey)
    throw new Error(`ClinVar lookup failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  })

  clinVarCache.set(cacheKey, promise)
  return promise
}

export async function fetchClinVarBatch(
  variants: Array<{ variant: VcfVariantRecord; assembly: 'GRCh37' | 'GRCh38'; externalId?: string }>,
  limit = 5,
) {
  const selected = variants.slice(0, Math.max(1, Math.min(limit, 5)))
  const results: Array<{ key: string; records: ClinVarSummary[]; error?: string }> = []

  for (const item of selected) {
    const key = `${item.variant.chrom}:${item.variant.pos}:${item.variant.ref}>${item.variant.alt}`
    try {
      const records = await fetchClinVarForVariant(item.variant, item.assembly, item.externalId)
      results.push({ key, records })
    } catch (cause) {
      results.push({ key, records: [], error: cause instanceof Error ? cause.message : 'ClinVar lookup failed.' })
    }
  }
  return results
}

export function fetchCpicPairsForGene(gene: string): Promise<CpicGeneDrugPair[]> {
  const symbol = gene.trim().toUpperCase()
  if (!symbol) return Promise.resolve([])
  const cached = cpicCache.get(symbol)
  if (cached) return cached

  const select = 'genesymbol,drugname,guidelinename,guidelineurl,cpiclevel,clinpgxlevel,pgxtesting,usedforrecommendation,provisional,pmids'
  const url = `${CPIC_API}/pair_view?genesymbol=eq.${encodeURIComponent(symbol)}&select=${encodeURIComponent(select)}&order=drugname&limit=30`
  const promise = fetchJson<CpicGeneDrugPair[]>(url, 12000)
    .then((rows) => rows.filter((row) => row && row.genesymbol && row.drugname))
    .catch((error) => {
      cpicCache.delete(symbol)
      throw new Error(`CPIC lookup failed for ${symbol}: ${error instanceof Error ? error.message : 'unknown error'}`)
    })
  cpicCache.set(symbol, promise)
  return promise
}

export async function fetchCpicPairsForGenes(genes: string[], limitGenes = 6) {
  const selected = [...new Set(genes.map((gene) => gene.trim().toUpperCase()).filter(Boolean))].slice(0, limitGenes)
  const settled = await Promise.allSettled(selected.map((gene) => fetchCpicPairsForGene(gene)))
  const pairs: CpicGeneDrugPair[] = []
  const errors: string[] = []
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') pairs.push(...result.value)
    else errors.push(result.reason instanceof Error ? result.reason.message : `CPIC lookup failed for ${selected[index]}.`)
  })

  const seen = new Set<string>()
  return {
    pairs: pairs.filter((pair) => {
      const key = `${pair.genesymbol}|${pair.drugname}|${pair.guidelinename || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
    errors,
  }
}

export function clinVarRecordUrl(record: ClinVarSummary) {
  return `https://www.ncbi.nlm.nih.gov/clinvar/variation/${encodeURIComponent(record.accessionVersion || record.accession || record.uid)}/`
}

export const CLINVAR_PROGRAMMATIC_ACCESS = 'https://www.ncbi.nlm.nih.gov/clinvar/docs/programmatic_access/'
export const CPIC_API_DOCS = 'https://api.cpicpgx.org/'
