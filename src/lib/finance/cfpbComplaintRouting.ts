export type ComplaintRecord = {
  id: string
  narrative: string
  product: string
}

export type ComplaintNeighbor = ComplaintRecord & {
  similarity: number
}

export type ComplaintRoute = {
  candidate: string | null
  evidenceShare: number
  uncertain: boolean
  reason: string
  alternatives: Array<{ product: string; evidenceShare: number; matches: number }>
  neighbors: ComplaintNeighbor[]
}

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','but','by','for','from','had','has','have','i','in',
  'is','it','me','my','of','on','or','our','that','the','their','they','this','to','was','we',
  'were','with','you','your',
])

export function tokenizeComplaint(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

export function parseComplaintCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      field = ''
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
    } else {
      field += char
    }
  }
  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)

  const headers = (rows.shift() ?? []).map((header) => header.trim())
  return { headers, rows }
}

export function suggestComplaintColumns(headers: string[]): {
  narrative: string
  product: string
  id: string
} {
  const lower = headers.map((header) => header.toLocaleLowerCase())
  const find = (candidates: string[]) => {
    const index = lower.findIndex((header) => candidates.some((candidate) => header.includes(candidate)))
    return index >= 0 ? headers[index] : ''
  }
  return {
    narrative: find(['consumer complaint narrative', 'complaint narrative', 'narrative', 'complaint text']),
    product: find(['product', 'issue category', 'category']),
    id: find(['complaint id', 'complaint_id', 'id']),
  }
}

function termCounts(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1)
  return counts
}

function cosine(
  left: Map<string, number>,
  right: Map<string, number>,
  idf: Map<string, number>,
): number {
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  const terms = new Set([...left.keys(), ...right.keys()])
  for (const term of terms) {
    const weight = idf.get(term) ?? 1
    const a = (left.get(term) ?? 0) * weight
    const b = (right.get(term) ?? 0) * weight
    dot += a * b
    leftNorm += a * a
    rightNorm += b * b
  }
  if (leftNorm === 0 || rightNorm === 0) return 0
  return dot / Math.sqrt(leftNorm * rightNorm)
}

export function routeComplaint(
  records: ComplaintRecord[],
  query: string,
  limit = 5,
): ComplaintRoute {
  const queryTokens = tokenizeComplaint(query)
  if (records.length < 5) {
    return {
      candidate: null,
      evidenceShare: 0,
      uncertain: true,
      reason: 'Import at least five labeled complaints before comparing a new narrative.',
      alternatives: [],
      neighbors: [],
    }
  }
  if (queryTokens.length < 3) {
    return {
      candidate: null,
      evidenceShare: 0,
      uncertain: true,
      reason: 'Enter a longer complaint narrative so the comparison has enough context.',
      alternatives: [],
      neighbors: [],
    }
  }

  const documentTokens = records.map((record) => tokenizeComplaint(record.narrative))
  const documentFrequency = new Map<string, number>()
  for (const tokens of documentTokens) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)
    }
  }
  const idf = new Map<string, number>()
  for (const [term, frequency] of documentFrequency) {
    idf.set(term, Math.log((records.length + 1) / (frequency + 1)) + 1)
  }

  const queryCounts = termCounts(queryTokens)
  const neighbors = records
    .map((record, index) => ({
      ...record,
      similarity: cosine(queryCounts, termCounts(documentTokens[index]), idf),
    }))
    .filter((record) => record.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity || a.id.localeCompare(b.id))
    .slice(0, Math.max(1, limit))

  if (neighbors.length === 0) {
    return {
      candidate: null,
      evidenceShare: 0,
      uncertain: true,
      reason: 'No sufficiently similar imported complaint was found.',
      alternatives: [],
      neighbors: [],
    }
  }

  const scores = new Map<string, { score: number; matches: number }>()
  for (const neighbor of neighbors) {
    const current = scores.get(neighbor.product) ?? { score: 0, matches: 0 }
    current.score += neighbor.similarity
    current.matches += 1
    scores.set(neighbor.product, current)
  }
  const total = [...scores.values()].reduce((sum, value) => sum + value.score, 0)
  const alternatives = [...scores]
    .map(([product, value]) => ({
      product,
      evidenceShare: total > 0 ? value.score / total : 0,
      matches: value.matches,
    }))
    .sort((a, b) => b.evidenceShare - a.evidenceShare || a.product.localeCompare(b.product))

  const top = alternatives[0]
  const second = alternatives[1]
  const uncertain = top.evidenceShare < 0.55 || (second ? top.evidenceShare - second.evidenceShare < 0.15 : false)

  return {
    candidate: top.product,
    evidenceShare: top.evidenceShare,
    uncertain,
    reason: uncertain
      ? 'The closest imported examples do not form a clear majority; manual review is required.'
      : 'The candidate reflects the strongest weighted group among the closest imported examples.',
    alternatives,
    neighbors,
  }
}
