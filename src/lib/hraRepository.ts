export type HraSex = 'male' | 'female'

export type HraRepositoryFile = {
  name: string
  size: number
  downloadUrl: string
  htmlUrl: string
  sha: string
}

export type HraStructureRecord = {
  label: string
  nodeName: string
  ontologyId: string
  representationOf: string
  sourceSpatialEntity: string
  model: HraRepositoryFile
}

export type HraPresetKey = 'overview' | 'thorax' | 'abdomen' | 'neuro' | 'knee-right' | 'knee-left' | 'eye' | 'pelvis' | 'immune'

export type HraPreset = {
  key: HraPresetKey
  label: string
  detail: string
  files: Record<HraSex, string[]>
}

export type HraEvidenceRecord = {
  release: 'v1.2' | 'v2.0'
  label: string
  nodeName: string
  ontologyId: string
  representationOf: string
  sourceSpatialEntity: string
  modelStem: string
  model?: HraRepositoryFile
}

export const HRA_REPOSITORY = 'https://github.com/hubmapconsortium/ccf-releases'
export const HRA_MODELS_REPOSITORY = `${HRA_REPOSITORY}/tree/main/v1.2/models`
export const HRA_LIBRARY = 'https://humanatlas.io/3d-reference-library'
export const HRA_MODELS_API = 'https://api.github.com/repos/hubmapconsortium/ccf-releases/contents/v1.2/models'
export const HRA_MAPPING_CSV = 'https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.2/models/ASCT-B_3D_Models_Mapping.csv'
export const HRA_RAW_MODELS = 'https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.2/models/'
export const HRA_V2_MODELS_REPOSITORY = `${HRA_REPOSITORY}/tree/main/v2.0/models`
export const HRA_V2_CROSSWALK_CSV = 'https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v2.0/models/asct-b-3d-models-crosswalk.csv'

export const HRA_PRESETS: HraPreset[] = [
  {
    key: 'overview',
    label: 'Whole body',
    detail: 'Skin envelope, vasculature, heart and lungs in the common coordinate framework.',
    files: {
      male: ['VH_M_Skin.glb', 'VH_M_Blood_Vasculature.glb', 'VH_M_Heart.glb', 'VH_M_Lung.glb'],
      female: ['VH_F_Skin.glb', 'VH_F_Blood_Vasculature.glb', 'VH_F_Heart.glb', 'VH_F_Lung.glb'],
    },
  },
  {
    key: 'thorax',
    label: 'Thorax',
    detail: 'Cardiopulmonary reference objects with whole-body vasculature for orientation.',
    files: {
      male: ['VH_M_Heart.glb', 'VH_M_Lung.glb', 'VH_M_Blood_Vasculature.glb'],
      female: ['VH_F_Heart.glb', 'VH_F_Lung.glb', 'VH_F_Blood_Vasculature.glb'],
    },
  },
  {
    key: 'abdomen',
    label: 'Abdomen',
    detail: 'Liver, kidneys, pancreas, bowel and spleen from the HRA release.',
    files: {
      male: ['VH_M_Liver.glb', 'VH_M_Kidney_L.glb', 'VH_M_Kidney_R.glb', 'VH_M_Pancreas.glb', 'VH_M_Small_Intestine.glb', 'SBU_M_Intestine_Large.glb', 'VH_M_Spleen.glb'],
      female: ['VH_F_Liver.glb', 'VH_F_Kidney_L.glb', 'VH_F_Kidney_R.glb', 'VH_F_Pancreas.glb', 'VH_F_Small_Intestine.glb', 'SBU_F_Intestine_Large.glb', 'VH_F_Spleen.glb'],
    },
  },
  {
    key: 'neuro',
    label: 'Brain & cord',
    detail: 'Allen brain reference object plus Visible Human spinal cord.',
    files: {
      male: ['Allen_M_Brain.glb', 'VH_M_Spinal_Cord.glb'],
      female: ['Allen_F_Brain.glb', 'VH_F_Spinal_Cord.glb'],
    },
  },
  {
    key: 'knee-right',
    label: 'Right knee',
    detail: 'Right knee reference object. Its mapped structures include femur, tibia, fibula, patella, cartilage and meniscus.',
    files: {
      male: ['VH_M_Knee_R.glb'],
      female: ['VH_F_Knee_R.glb'],
    },
  },
  {
    key: 'knee-left',
    label: 'Left knee',
    detail: 'Left knee reference object for orthopaedic structure inspection.',
    files: {
      male: ['VH_M_Knee_L.glb'],
      female: ['VH_F_Knee_L.glb'],
    },
  },
  {
    key: 'eye',
    label: 'Eyes',
    detail: 'Left and right eye reference objects with detailed mapped ocular structures.',
    files: {
      male: ['VH_M_Eye_L.glb', 'VH_M_Eye_R.glb'],
      female: ['VH_F_Eye_L.glb', 'VH_F_Eye_R.glb'],
    },
  },
  {
    key: 'pelvis',
    label: 'Pelvis',
    detail: 'Pelvic and genitourinary reference anatomy. Sex-specific HRA objects are kept separate.',
    files: {
      male: ['VH_M_Pelvis.glb', 'VH_M_Prostate.glb', 'VH_M_Urinary_Bladder.glb', 'VH_M_Ureter_L.glb', 'VH_M_Ureter_R.glb', 'VH_M_Urethra.glb'],
      female: ['VH_F_Pelvis.glb', 'VH_F_Urinary_Bladder.glb', 'VH_F_Ureter_L.glb', 'VH_F_Ureter_R.glb', 'VH_F_Uterus.glb', 'VH_F_Ovary_L.glb', 'VH_F_Ovary_R.glb', 'VH_F_Fallopian_Tube_L.glb', 'VH_F_Fallopian_Tube_R.glb'],
    },
  },
  {
    key: 'immune',
    label: 'Immune',
    detail: 'Lymph-node reference object together with spleen and thymus.',
    files: {
      male: ['NIH_M_Lymph_Node.glb', 'VH_M_Spleen.glb', 'VH_M_Thymus.glb'],
      female: ['NIH_F_Lymph_Node.glb', 'VH_F_Spleen.glb', 'VH_F_Thymus.glb'],
    },
  },
]

type GithubFile = {
  name?: string
  size?: number
  download_url?: string | null
  html_url?: string | null
  sha?: string
  type?: string
}

let filePromise: Promise<HraRepositoryFile[]> | null = null
let structurePromise: Promise<HraStructureRecord[]> | null = null
let v2CrosswalkPromise: Promise<HraEvidenceRecord[]> | null = null

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

export function fetchHraRepositoryFiles() {
  if (filePromise) return filePromise
  filePromise = checkedFetch(HRA_MODELS_API, 'application/vnd.github+json')
    .then((response) => response.json() as Promise<GithubFile[]>)
    .then((rows) => rows
      .filter((item) => item.type === 'file' && item.name?.toLowerCase().endsWith('.glb') && item.download_url)
      .map((item) => ({
        name: item.name!,
        size: item.size ?? 0,
        downloadUrl: item.download_url!,
        htmlUrl: item.html_url || `${HRA_MODELS_REPOSITORY}/${item.name}`,
        sha: item.sha || '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name)))
    .catch((error) => {
      filePromise = null
      throw error
    })
  return filePromise
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
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
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
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (cell || row.length) {
    row.push(cell.trim())
    rows.push(row)
  }
  return rows
}

function resolveModelFile(value: string, files: HraRepositoryFile[]) {
  const candidates = value
    .split(/[;|]/)
    .map((part) => part.trim())
    .filter(Boolean)
  for (const candidate of candidates) {
    const expected = candidate.toLowerCase().endsWith('.glb') ? candidate : `${candidate}.glb`
    const exact = files.find((file) => file.name.toLowerCase() === expected.toLowerCase())
    if (exact) return exact
  }
  return undefined
}

function mappedColumns(rows: string[][]) {
  const headerIndex = rows.findIndex((row) => row.includes('anatomical_structure_of') && row.includes('glb file of single organs'))
  if (headerIndex < 0) throw new Error('HRA mapping header was not found.')
  const header = rows[headerIndex]
  return {
    headerIndex,
    labelIndex: header.indexOf('label'),
    nodeIndex: header.indexOf('node_name'),
    ontologyIndex: header.indexOf('OntologyID'),
    representationIndex: header.indexOf('representation_of'),
    sourceIndex: header.indexOf('source_spatial_entity'),
    modelIndex: header.indexOf('glb file of single organs'),
  }
}

export function fetchHraStructureIndex() {
  if (structurePromise) return structurePromise
  structurePromise = Promise.all([
    fetchHraRepositoryFiles(),
    checkedFetch(HRA_MAPPING_CSV, 'text/csv,text/plain;q=0.9,*/*;q=0.1').then((response) => response.text()),
  ]).then(([files, csv]) => {
    const rows = parseCsv(csv)
    const { headerIndex, labelIndex, nodeIndex, ontologyIndex, representationIndex, sourceIndex, modelIndex } = mappedColumns(rows)

    const result: HraStructureRecord[] = []
    const seen = new Set<string>()
    for (const row of rows.slice(headerIndex + 1)) {
      const model = resolveModelFile(row[modelIndex] || '', files)
      if (!model) continue
      const label = row[labelIndex] || row[nodeIndex] || model.name.replace(/\.glb$/i, '')
      const record: HraStructureRecord = {
        label,
        nodeName: row[nodeIndex] || '',
        ontologyId: row[ontologyIndex] || '',
        representationOf: row[representationIndex] || '',
        sourceSpatialEntity: row[sourceIndex] || '',
        model,
      }
      const key = `${record.label}|${record.ontologyId}|${record.model.name}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(record)
    }
    return result
  }).catch((error) => {
    structurePromise = null
    throw error
  })
  return structurePromise
}

export function fetchHraV2Crosswalk() {
  if (v2CrosswalkPromise) return v2CrosswalkPromise
  v2CrosswalkPromise = checkedFetch(HRA_V2_CROSSWALK_CSV, 'text/csv,text/plain;q=0.9,*/*;q=0.1')
    .then((response) => response.text())
    .then((csv) => {
      const rows = parseCsv(csv)
      const { headerIndex, labelIndex, nodeIndex, ontologyIndex, representationIndex, sourceIndex, modelIndex } = mappedColumns(rows)
      const result: HraEvidenceRecord[] = []
      const seen = new Set<string>()
      for (const row of rows.slice(headerIndex + 1)) {
        const modelStem = (row[modelIndex] || '').trim()
        const label = (row[labelIndex] || row[nodeIndex] || '').trim()
        const ontologyId = (row[ontologyIndex] || '').trim()
        if (!label || modelStem === '-' || !modelStem) continue
        const record: HraEvidenceRecord = {
          release: 'v2.0',
          label,
          nodeName: row[nodeIndex] || '',
          ontologyId,
          representationOf: row[representationIndex] || '',
          sourceSpatialEntity: row[sourceIndex] || '',
          modelStem,
        }
        const key = `${record.label}|${record.ontologyId}|${record.modelStem}`
        if (seen.has(key)) continue
        seen.add(key)
        result.push(record)
      }
      return result
    })
    .catch((error) => {
      v2CrosswalkPromise = null
      throw error
    })
  return v2CrosswalkPromise
}

export async function searchHraStructures(rawQuery: string, limit = 40) {
  const query = normalize(rawQuery)
  if (!query) return []
  const terms = query.split(' ').filter(Boolean)
  const rows = await fetchHraStructureIndex()
  return rows
    .map((record) => {
      const haystack = normalize(`${record.label} ${record.nodeName} ${record.ontologyId} ${record.model.name}`)
      const matched = terms.filter((term) => haystack.includes(term)).length
      const exactBoost = normalize(record.label) === query ? 100 : haystack.startsWith(query) ? 20 : 0
      return { record, score: matched * 10 + exactBoost }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.record.label.localeCompare(b.record.label))
    .slice(0, limit)
    .map((item) => item.record)
}

export async function searchHraEvidence(rawQuery: string, limit = 30) {
  const query = normalize(rawQuery)
  if (!query) return []
  const terms = query.split(' ').filter(Boolean)
  const [v12, v20] = await Promise.allSettled([fetchHraStructureIndex(), fetchHraV2Crosswalk()])
  const combined: HraEvidenceRecord[] = []

  if (v12.status === 'fulfilled') {
    combined.push(...v12.value.map((record) => ({
      release: 'v1.2' as const,
      label: record.label,
      nodeName: record.nodeName,
      ontologyId: record.ontologyId,
      representationOf: record.representationOf,
      sourceSpatialEntity: record.sourceSpatialEntity,
      modelStem: record.model.name.replace(/\.glb$/i, ''),
      model: record.model,
    })))
  }
  if (v20.status === 'fulfilled') combined.push(...v20.value)
  if (!combined.length) throw new Error('HRA source indexes are unavailable.')

  const scored = combined
    .map((record) => {
      const haystack = normalize(`${record.label} ${record.nodeName} ${record.ontologyId} ${record.modelStem}`)
      const matched = terms.filter((term) => haystack.includes(term)).length
      const exactBoost = normalize(record.label) === query ? 100 : haystack.startsWith(query) ? 20 : 0
      const releaseBoost = record.release === 'v2.0' ? 1 : 0
      return { record, score: matched * 10 + exactBoost + releaseBoost }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.record.label.localeCompare(b.record.label))

  const deduped: HraEvidenceRecord[] = []
  const seen = new Set<string>()
  for (const item of scored) {
    const key = `${normalize(item.record.label)}|${item.record.ontologyId || normalize(item.record.modelStem)}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item.record)
    if (deduped.length >= limit) break
  }
  return deduped
}

export function rawHraModelUrl(fileName: string) {
  return `${HRA_RAW_MODELS}${encodeURIComponent(fileName)}`
}
