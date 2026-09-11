import { api, backendEnabled } from './api'

export type SourceStatus = 'idle' | 'loading' | 'ready' | 'partial' | 'error'

export interface LiteratureResult {
  id: string
  source: string
  title: string
  authors: string
  journal: string
  year?: string
  abstract?: string
  citedBy?: number
  url: string
}

export interface OntologyResult {
  id: string
  label: string
  ontology: string
  description?: string
  iri?: string
  url: string
}

export interface TrialResult {
  id: string
  title: string
  status: string
  conditions: string[]
  interventions: string[]
  phase?: string
  url: string
}

export interface DrugLabelResult {
  id: string
  brand: string
  generic: string
  indication?: string
  warning?: string
  dosage?: string
  url: string
}

export interface MedicalSourceBundle {
  query: string
  literature: LiteratureResult[]
  ontology: OntologyResult[]
  trials: TrialResult[]
  drugLabels: DrugLabelResult[]
  errors: Partial<Record<'literature' | 'ontology' | 'trials' | 'drugLabels', string>>
  fetchedAt: string
}

export interface MedicalSourceSearchOptions {
  signal?: AbortSignal
}

const EUROPE_PMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'
const OLS = 'https://www.ebi.ac.uk/ols4/api/search'
const OPENFDA = 'https://api.fda.gov/drug/label.json'
const OPENFDA_DOCS = 'https://open.fda.gov/apis/drug/label/'

function cleanQuery(value: string) {
  return value.replace(/[<>\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
}

function abortError(message = 'Request cancelled.') {
  const error = new Error(message)
  error.name = 'AbortError'
  return error
}

function isAbortError(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
}

async function fetchJson<T>(url: string, timeoutMs = 12000, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()

  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', abortFromCaller, { once: true })

  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json() as T
  } finally {
    globalThis.clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

function firstText(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const item = value.find((entry) => typeof entry === 'string' && entry.trim())
    return typeof item === 'string' ? item.trim() : undefined
  }
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function openFdaSetUrl(setId: string | undefined) {
  const clean = setId?.trim()
  if (!clean) return undefined
  const params = new URLSearchParams({ search: `set_id:"${clean}"`, limit: '1' })
  return `${OPENFDA}?${params.toString()}`
}

async function searchEuropePmc(query: string, signal?: AbortSignal): Promise<LiteratureResult[]> {
  type EuropePmcResponse = {
    resultList?: {
      result?: Array<{
        id?: string
        source?: string
        title?: string
        authorString?: string
        journalTitle?: string
        pubYear?: string
        abstractText?: string
        citedByCount?: number
        pmid?: string
        pmcid?: string
      }>
    }
  }
  const url = `${EUROPE_PMC}?query=${encodeURIComponent(query)}&format=json&pageSize=5&resultType=core`
  const data = await fetchJson<EuropePmcResponse>(url, 12000, signal)
  return (data.resultList?.result ?? []).map((item, index) => {
    const source = item.source || (item.pmid ? 'MED' : item.pmcid ? 'PMC' : 'Europe PMC')
    const id = item.id || item.pmid || item.pmcid || `epmc-${index}`
    return {
      id,
      source,
      title: item.title || 'Untitled publication',
      authors: item.authorString || 'Authors not supplied',
      journal: item.journalTitle || 'Journal not supplied',
      year: item.pubYear,
      abstract: item.abstractText,
      citedBy: typeof item.citedByCount === 'number' ? item.citedByCount : undefined,
      url: `https://europepmc.org/article/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
    }
  })
}

async function searchOls(query: string, signal?: AbortSignal): Promise<OntologyResult[]> {
  type OlsResponse = {
    response?: {
      docs?: Array<{
        iri?: string
        label?: string
        ontology_name?: string
        ontology_prefix?: string
        obo_id?: string
        short_form?: string
        description?: string[] | string
      }>
    }
  }
  const url = `${OLS}?q=${encodeURIComponent(query)}&ontology=uberon,cl,efo&rows=6&queryFields=label,synonym,description`
  const data = await fetchJson<OlsResponse>(url, 12000, signal)
  return (data.response?.docs ?? []).map((item, index) => ({
    id: item.obo_id || item.short_form || `ols-${index}`,
    label: item.label || item.obo_id || 'Ontology term',
    ontology: (item.ontology_name || item.ontology_prefix || 'OLS').toUpperCase(),
    description: firstText(item.description),
    iri: item.iri,
    url: `https://www.ebi.ac.uk/ols4/search?q=${encodeURIComponent(item.label || query)}`,
  }))
}

async function searchTrials(query: string, signal?: AbortSignal): Promise<TrialResult[]> {
  if (!backendEnabled) throw new Error('ClinicalTrials.gov search requires the Panacea backend.')
  if (signal?.aborted) throw abortError()

  const data = await api.searchTrials(query, false, '')
  if (signal?.aborted) throw abortError()

  return data.trials.slice(0, 5).map((study) => ({
    id: study.nctId,
    title: study.title || 'Clinical study',
    status: study.status || 'Status not supplied',
    conditions: study.conditions ? [study.conditions] : [],
    interventions: [],
    phase: study.phase && study.phase !== 'N/A' ? study.phase : undefined,
    url: study.url || `https://clinicaltrials.gov/study/${encodeURIComponent(study.nctId)}`,
  }))
}

async function searchDrugLabels(query: string, signal?: AbortSignal): Promise<DrugLabelResult[]> {
  // Production deployments use the Panacea server adapter so request policy,
  // upstream timeouts and source-identity handling stay in one tested place.
  if (backendEnabled) {
    if (signal?.aborted) throw abortError()
    const data = await api.lookupDrug(query)
    if (signal?.aborted) throw abortError()
    if (data.error) throw new Error(data.error)

    type BackendDrug = NonNullable<typeof data.drug> & {
      labelId?: string
      sourceUrl?: string
    }
    const drug = data.drug as BackendDrug | null
    if (!drug) return []

    return [{
      id: drug.labelId || `query:${cleanQuery(query)}`,
      brand: drug.brand || 'Brand not supplied',
      generic: drug.generic || cleanQuery(query),
      indication: drug.usage || drug.purpose || undefined,
      warning: drug.warnings || undefined,
      dosage: drug.dosage || undefined,
      url: drug.sourceUrl || OPENFDA_DOCS,
    }]
  }

  // Static demo fallback: openFDA is public/keyless, so GitHub Pages can still
  // demonstrate label retrieval without pretending the production backend is
  // present. This path retains the same bounded/cancellable client adapter.
  type OpenFdaResponse = {
    results?: Array<{
      id?: string
      set_id?: string
      openfda?: { brand_name?: string[]; generic_name?: string[] }
      indications_and_usage?: string[]
      purpose?: string[]
      boxed_warning?: string[]
      warnings?: string[]
      warnings_and_cautions?: string[]
      dosage_and_administration?: string[]
    }>
  }
  const fdaTerm = cleanQuery(query).replace(/[":]/g, ' ')
  const searches = [
    `openfda.generic_name:"${fdaTerm}"`,
    `openfda.brand_name:"${fdaTerm}"`,
  ]
  let data: OpenFdaResponse | null = null
  let lastError: unknown
  for (const search of searches) {
    try {
      data = await fetchJson<OpenFdaResponse>(`${OPENFDA}?search=${encodeURIComponent(search)}&limit=3`, 12000, signal)
      if ((data.results?.length ?? 0) > 0) break
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) throw error
      lastError = error
    }
  }
  if (!data?.results?.length) {
    if (lastError instanceof Error) throw lastError
    return []
  }
  return data.results.map((item, index) => {
    const setId = item.set_id?.trim() || undefined
    return {
      id: setId || item.id || `fda-${index}`,
      brand: firstText(item.openfda?.brand_name) || 'Brand not supplied',
      generic: firstText(item.openfda?.generic_name) || fdaTerm,
      indication: firstText(item.indications_and_usage) || firstText(item.purpose),
      warning: firstText(item.boxed_warning) || firstText(item.warnings_and_cautions) || firstText(item.warnings),
      dosage: firstText(item.dosage_and_administration),
      url: openFdaSetUrl(setId) || OPENFDA_DOCS,
    }
  })
}

function message(error: unknown) {
  if (isAbortError(error)) return 'Request cancelled or timed out.'
  return error instanceof Error ? error.message : 'Source request failed.'
}

export async function searchMedicalSources(
  rawQuery: string,
  options: MedicalSourceSearchOptions = {},
): Promise<MedicalSourceBundle> {
  const query = cleanQuery(rawQuery)
  if (!query) throw new Error('Enter a medical, anatomy, drug, disease, procedure, or physiology term.')
  if (options.signal?.aborted) throw abortError()

  const [literature, ontology, trials, drugLabels] = await Promise.allSettled([
    searchEuropePmc(query, options.signal),
    searchOls(query, options.signal),
    searchTrials(query, options.signal),
    searchDrugLabels(query, options.signal),
  ])

  if (options.signal?.aborted) throw abortError()

  return {
    query,
    literature: literature.status === 'fulfilled' ? literature.value : [],
    ontology: ontology.status === 'fulfilled' ? ontology.value : [],
    trials: trials.status === 'fulfilled' ? trials.value : [],
    drugLabels: drugLabels.status === 'fulfilled' ? drugLabels.value : [],
    errors: {
      literature: literature.status === 'rejected' ? message(literature.reason) : undefined,
      ontology: ontology.status === 'rejected' ? message(ontology.reason) : undefined,
      trials: trials.status === 'rejected' ? message(trials.reason) : undefined,
      drugLabels: drugLabels.status === 'rejected' ? message(drugLabels.reason) : undefined,
    },
    fetchedAt: new Date().toISOString(),
  }
}
