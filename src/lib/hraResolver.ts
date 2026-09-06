import {
  HRA_V2_CROSSWALK_CSV,
  searchHraEvidence,
  type HraEvidenceRecord,
  type HraRepositoryFile,
} from './hraRepository'

export type HraResolvedRelease = 'v1.2' | 'v1.4' | 'v2.0'

export type HraResolvedRecord = {
  release: HraResolvedRelease
  label: string
  nodeName: string
  ontologyId: string
  representationOf: string
  sourceSpatialEntity: string
  modelStem: string
  model?: HraRepositoryFile
  renderable: boolean
  sourceUrl: string
}

const REPO = 'hubmapconsortium/ccf-releases'
const V14_MODELS_API = `https://api.github.com/repos/${REPO}/contents/v1.4/models`
const V14_MODELS_REPOSITORY = `https://github.com/${REPO}/tree/main/v1.4/models`
const V14_CROSSWALK = `https://raw.githubusercontent.com/${REPO}/main/v1.4/models/asct-b-3d-models-crosswalk.csv`

export const HRA_V14_CROSSWALK_CSV = V14_CROSSWALK
export const HRA_V14_MODELS_REPOSITORY = V14_MODELS_REPOSITORY

type GithubFile = {
  name?: string
  size?: number
  download_url?: string | null
  html_url?: string | null
  sha?: string
  type?: string
}

type MappingRow = {
  label: string
  nodeName: string
  ontologyId: string
  representationOf: string
  sourceSpatialEntity: string
  modelStem: string
}

let v14FilesPromise: Promise<HraRepositoryFile[]> | null = null
let v14MappingPromise: Promise<MappingRow[]> | null = null

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

async function checkedFetch(url: string, accept: string) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: accept } })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return response
  } finally {
    window.clearTimeout(timeout)
  }
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') quoted = false
      else cell += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (char === '\n') {
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') cell += char
  }
  if (cell || row.length) {
    row.push(cell.trim())
    rows.push(row)
  }
  return rows
}

function mappingColumns(rows: string[][]) {
  const headerIndex = rows.findIndex((row) => row.includes('anatomical_structure_of') && row.includes('glb file of single organs'))
  if (headerIndex < 0) throw new Error('HRA crosswalk header was not found.')
  const header = rows[headerIndex]
  return {
    headerIndex,
    label: header.indexOf('label'),
    node: header.indexOf('node_name'),
    ontology: header.indexOf('OntologyID'),
    representation: header.indexOf('representation_of'),
    source: header.indexOf('source_spatial_entity'),
    model: header.indexOf('glb file of single organs'),
  }
}

export function fetchHraV14Files() {
  if (v14FilesPromise) return v14FilesPromise
  v14FilesPromise = checkedFetch(V14_MODELS_API, 'application/vnd.github+json')
    .then((response) => response.json() as Promise<GithubFile[]>)
    .then((rows) => rows
      .filter((item) => item.type === 'file' && item.name?.endsWith('.glb') && item.download_url)
      .map((item) => ({
        name: item.name!,
        size: item.size ?? 0,
        downloadUrl: item.download_url!,
        htmlUrl: item.html_url || `${V14_MODELS_REPOSITORY}/${item.name}`,
        sha: item.sha || '',
      })))
    .catch((error) => {
      v14FilesPromise = null
      throw error
    })
  return v14FilesPromise
}

export function fetchHraV14Mapping() {
  if (v14MappingPromise) return v14MappingPromise
  v14MappingPromise = checkedFetch(V14_CROSSWALK, 'text/csv,text/plain;q=0.9,*/*;q=0.1')
    .then((response) => response.text())
    .then((text) => {
      const rows = parseCsv(text)
      const columns = mappingColumns(rows)
      return rows.slice(columns.headerIndex + 1)
        .map((row) => ({
          label: (row[columns.label] || row[columns.node] || '').trim(),
          nodeName: (row[columns.node] || '').trim(),
          ontologyId: (row[columns.ontology] || '').trim(),
          representationOf: (row[columns.representation] || '').trim(),
          sourceSpatialEntity: (row[columns.source] || '').trim(),
          modelStem: (row[columns.model] || '').trim(),
        }))
        .filter((row) => row.label && row.modelStem && row.modelStem !== '-')
    })
    .catch((error) => {
      v14MappingPromise = null
      throw error
    })
  return v14MappingPromise
}

function fromLegacy(record: HraEvidenceRecord): HraResolvedRecord {
  return {
    release: record.release,
    label: record.label,
    nodeName: record.nodeName,
    ontologyId: record.ontologyId,
    representationOf: record.representationOf,
    sourceSpatialEntity: record.sourceSpatialEntity,
    modelStem: record.modelStem,
    model: record.model,
    renderable: Boolean(record.model),
    sourceUrl: record.model?.htmlUrl || HRA_V2_CROSSWALK_CSV,
  }
}

function modelForStem(stem: string, files: HraRepositoryFile[]) {
  const expected = stem.toLowerCase().endsWith('.glb') ? stem.toLowerCase() : `${stem.toLowerCase()}.glb`
  return files.find((file) => file.name.toLowerCase() === expected)
}

function scoreRecord(record: HraResolvedRecord, query: string) {
  const normalized = normalize(query)
  const terms = normalized.split(' ').filter(Boolean)
  const haystack = normalize(`${record.label} ${record.nodeName} ${record.ontologyId} ${record.modelStem}`)
  const matched = terms.filter((term) => haystack.includes(term)).length
  const exact = normalize(record.label) === normalized ? 100 : haystack.startsWith(normalized) ? 20 : 0
  const release = record.release === 'v1.4' ? 4 : record.release === 'v1.2' ? 3 : 2
  const renderable = record.renderable ? 6 : 0
  return matched * 10 + exact + release + renderable
}

export async function resolveHraQuery(query: string, limit = 20): Promise<HraResolvedRecord[]> {
  const clean = query.trim()
  if (!clean) return []

  const [legacy, v14Files, v14Rows] = await Promise.allSettled([
    searchHraEvidence(clean, Math.max(limit, 20)),
    fetchHraV14Files(),
    fetchHraV14Mapping(),
  ])

  const combined: HraResolvedRecord[] = []
  if (legacy.status === 'fulfilled') combined.push(...legacy.value.map(fromLegacy))

  if (v14Rows.status === 'fulfilled') {
    const files = v14Files.status === 'fulfilled' ? v14Files.value : []
    for (const row of v14Rows.value) {
      const record: HraResolvedRecord = {
        release: 'v1.4',
        ...row,
        model: modelForStem(row.modelStem, files),
        renderable: Boolean(modelForStem(row.modelStem, files)),
        sourceUrl: modelForStem(row.modelStem, files)?.htmlUrl || V14_CROSSWALK,
      }
      if (scoreRecord(record, clean) > 10) combined.push(record)
    }
  }

  if (!combined.length) throw new Error('No HRA release index was available.')

  const ranked = combined
    .map((record) => ({ record, score: scoreRecord(record, clean) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.record.label.localeCompare(b.record.label))

  const output: HraResolvedRecord[] = []
  const seen = new Set<string>()
  for (const item of ranked) {
    const key = `${normalize(item.record.label)}|${item.record.ontologyId || normalize(item.record.modelStem)}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(item.record)
    if (output.length >= limit) break
  }
  return output
}

export async function resolveHraTerms(terms: string[], limit = 12) {
  const unique = [...new Set(terms.map((term) => term.trim()).filter(Boolean))].slice(0, 16)
  const results = await Promise.allSettled(unique.map((term) => resolveHraQuery(term, 8)))
  const merged: HraResolvedRecord[] = []
  const seen = new Set<string>()

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const record of result.value) {
      const key = `${normalize(record.label)}|${record.ontologyId || normalize(record.modelStem)}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(record)
      if (merged.length >= limit) return merged
    }
  }
  return merged
}
