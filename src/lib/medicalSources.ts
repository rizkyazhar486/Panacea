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

const EUROPE_PMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'
const OLS = 'https://www.ebi.ac.uk/ols4/api/search'
const CLINICAL_TRIALS = 'https://clinicaltrials.gov/api/v2/studies'
const OPENFDA = 'https://api.fda.gov/drug/label.json'

function cleanQuery(value: string) {
  return value.replace(/[<>\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
}

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json() as T
  } finally {
    window.clearTimeout(timer)
  }
}

function firstText(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const item = value.find((entry) => typeof entry === 'string' && entry.trim())
    return typeof item === 'string' ? item.trim() : undefined
  }
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

async function searchEuropePmc(query: string): Promise<LiteratureResult[]> {
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
  const data = await fetchJson<EuropePmcResponse>(url)
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

async function searchOls(query: string): Promise<OntologyResult[]> {
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
  const data = await fetchJson<OlsResponse>(url)
  return (data.response?.docs ?? []).map((item, index) => ({
    id: item.obo_id || item.short_form || `ols-${index}`,
    label: item.label || item.obo_id || 'Ontology term',
    ontology: (item.ontology_name || item.ontology_prefix || 'OLS').toUpperCase(),
    description: firstText(item.description),
    iri: item.iri,
    url: `https://www.ebi.ac.uk/ols4/search?q=${encodeURIComponent(item.label || query)}`,
  }))
}

async function searchTrials(query: string): Promise<TrialResult[]> {
  type TrialsResponse = {
    studies?: Array<{
      protocolSection?: {
        identificationModule?: { nctId?: string; briefTitle?: string; officialTitle?: string }
        statusModule?: { overallStatus?: string }
        conditionsModule?: { conditions?: string[] }
        armsInterventionsModule?: { interventions?: Array<{ name?: string; type?: string }> }
        designModule?: { phases?: string[] }
      }
    }>
  }
  const url = `${CLINICAL_TRIALS}?query.term=${encodeURIComponent(query)}&pageSize=5&format=json`
  const data = await fetchJson<TrialsResponse>(url)
  return (data.studies ?? []).map((study, index) => {
    const section = study.protocolSection
    const identification = section?.identificationModule
    const id = identification?.nctId || `trial-${index}`
    return {
      id,
      title: identification?.briefTitle || identification?.officialTitle || 'Clinical study',
      status: section?.statusModule?.overallStatus || 'Status not supplied',
      conditions: section?.conditionsModule?.conditions ?? [],
      interventions: (section?.armsInterventionsModule?.interventions ?? []).map((item) => item.name || item.type || '').filter(Boolean),
      phase: section?.designModule?.phases?.join(', '),
      url: `https://clinicaltrials.gov/study/${encodeURIComponent(id)}`,
    }
  })
}

async function searchDrugLabels(query: string): Promise<DrugLabelResult[]> {
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
      data = await fetchJson<OpenFdaResponse>(`${OPENFDA}?search=${encodeURIComponent(search)}&limit=3`)
      if ((data.results?.length ?? 0) > 0) break
    } catch (error) {
      lastError = error
    }
  }
  if (!data?.results?.length) {
    if (lastError instanceof Error) throw lastError
    return []
  }
  return data.results.map((item, index) => ({
    id: item.id || item.set_id || `fda-${index}`,
    brand: firstText(item.openfda?.brand_name) || 'Brand not supplied',
    generic: firstText(item.openfda?.generic_name) || fdaTerm,
    indication: firstText(item.indications_and_usage) || firstText(item.purpose),
    warning: firstText(item.boxed_warning) || firstText(item.warnings_and_cautions) || firstText(item.warnings),
    dosage: firstText(item.dosage_and_administration),
    url: 'https://open.fda.gov/apis/drug/label/',
  }))
}

function message(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') return 'Request timed out.'
  return error instanceof Error ? error.message : 'Source request failed.'
}

export async function searchMedicalSources(rawQuery: string): Promise<MedicalSourceBundle> {
  const query = cleanQuery(rawQuery)
  if (!query) throw new Error('Enter a medical, anatomy, drug, disease, procedure, or physiology term.')

  const [literature, ontology, trials, drugLabels] = await Promise.allSettled([
    searchEuropePmc(query),
    searchOls(query),
    searchTrials(query),
    searchDrugLabels(query),
  ])

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
