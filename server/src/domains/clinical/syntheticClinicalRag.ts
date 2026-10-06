import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

export const OPUS55_SOURCE = Object.freeze({
  id: 'nisten_opus55_doctor_patient',
  dataset: 'nisten/opus5-5-doctor-patient-conversations-all-human-diseases',
  revision: '59b4f0a01688ede69fbdc37a14b961ff232668e1',
  sha256: 'f828c30cee7006a3cf5b88909f9b865688f98b11d4c886108b9b9a39e5402e0b',
})

export type SyntheticClinicalPurpose = 'chatbot' | 'ai-emr'

type PubmedRef = { pmid: string; title: string; year?: number }
type TeachingMistake = { mistake: string; explanation: string }
type DifferentialHint = { condition: string; differentiating_factors: string }

type IndexedRecord = {
  name: string
  nameNorm: string
  aliases: string[]
  aliasNorm: string[]
  search: string[]
  description: string
  executiveSummary: string
  icd10: string
  bodySystems: string[]
  pubmedRefs: PubmedRef[]
  commonMistakes: TeachingMistake[]
  differentialDiagnosis: DifferentialHint[]
  tokens: Set<string>
}

export type SyntheticClinicalGrounding = {
  sourceId: typeof OPUS55_SOURCE.id
  revision: typeof OPUS55_SOURCE.revision
  truthClass: 'synthetic-research-context'
  purpose: SyntheticClinicalPurpose
  hitCount: number
  hits: { name: string; icd10: string; score: number }[]
  context: string
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from', 'has',
  'have', 'he', 'her', 'his', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'patient',
  'she', 'that', 'the', 'their', 'this', 'to', 'was', 'were', 'with', 'you',
])

const MAX_QUERY_CHARS = 2_000
const MAX_CONTEXT_CHARS = 6_000
const DEFAULT_HITS = 3

let cachedPath = ''
let cachedIndex: Promise<IndexedRecord[]> | null = null

function enabled(): boolean {
  return /^(1|true|yes|on)$/i.test(process.env.PANACEA_SYNTHETIC_CLINICAL_RAG || '')
}

function configuredPath(): string {
  const explicit = process.env.PANACEA_OPUS55_DATASET_PATH?.trim()
  if (explicit) return explicit
  return fileURLToPath(new URL('../data/clinical-rag/opus5-5diseaseconversations.jsonl', import.meta.url))
}

function cleanText(value: unknown, max = 2_000): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function stringArray(value: unknown, maxItems = 32): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => cleanText(item, 240))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(' ')
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  )
}

function parsePubmedRefs(value: unknown): PubmedRef[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const pmid = cleanText(row.pmid, 24)
    const title = cleanText(row.title, 320)
    const year = typeof row.year === 'number' && Number.isFinite(row.year) ? Math.trunc(row.year) : undefined
    if (!/^\d+$/.test(pmid) || !title) return []
    return [{ pmid, title, ...(year ? { year } : {}) }]
  }).slice(0, 8)
}

function parseMistakes(value: unknown): TeachingMistake[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const mistake = cleanText(row.mistake, 260)
    const explanation = cleanText(row.explanation, 520)
    return mistake && explanation ? [{ mistake, explanation }] : []
  }).slice(0, 2)
}

function parseDifferentials(value: unknown): DifferentialHint[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const condition = cleanText(row.condition, 220)
    const differentiating_factors = cleanText(row.differentiating_factors, 520)
    return condition && differentiating_factors ? [{ condition, differentiating_factors }] : []
  }).slice(0, 4)
}

function toIndexedRecord(value: unknown): IndexedRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const name = cleanText(raw.name, 220)
  if (!name) return null

  const aliases = stringArray(raw.aliases, 24)
  const search = stringArray(raw.search, 32)
  const description = cleanText(raw.description, 1_800)
  const executiveSummary = cleanText(raw.executive_summary, 1_000)
  const icd10 = cleanText(raw.icd10, 80)
  const bodySystems = stringArray(raw.body_systems, 16)
  const nameNorm = normalize(name)
  const aliasNorm = aliases.map(normalize).filter(Boolean)

  const key = [
    name,
    aliases.join(' '),
    search.join(' '),
    description,
    executiveSummary,
    bodySystems.join(' '),
  ].join(' ')

  return {
    name,
    nameNorm,
    aliases,
    aliasNorm,
    search,
    description,
    executiveSummary,
    icd10,
    bodySystems,
    pubmedRefs: parsePubmedRefs(raw.pubmed_refs),
    commonMistakes: parseMistakes(raw.common_mistakes),
    differentialDiagnosis: parseDifferentials(raw.differential_diagnosis),
    tokens: tokenize(key),
  }
}

async function loadIndex(): Promise<IndexedRecord[]> {
  const file = configuredPath()
  if (!existsSync(file)) return []
  if (cachedIndex && cachedPath === file) return cachedIndex

  cachedPath = file
  cachedIndex = (async () => {
    const records: IndexedRecord[] = []
    const input = createReadStream(file, { encoding: 'utf8' })
    const lines = createInterface({ input, crlfDelay: Infinity })
    let lineNumber = 0

    for await (const line of lines) {
      lineNumber += 1
      if (!line.trim()) continue
      let parsed: unknown
      try {
        parsed = JSON.parse(line)
      } catch {
        throw new Error(`synthetic_clinical_rag_invalid_json_line_${lineNumber}`)
      }
      const record = toIndexedRecord(parsed)
      if (record) records.push(record)
    }

    return records
  })()

  return cachedIndex
}

function scoreRecord(record: IndexedRecord, queryNorm: string, queryTokens: Set<string>): number {
  let overlap = 0
  for (const token of queryTokens) {
    if (record.tokens.has(token)) overlap += 1
  }
  if (overlap === 0) return 0

  const coverage = overlap / Math.max(1, queryTokens.size)
  let phraseBoost = 0
  if (record.nameNorm.length > 2 && queryNorm.includes(record.nameNorm)) phraseBoost += 12
  if (record.aliasNorm.some((alias) => alias.length > 2 && queryNorm.includes(alias))) phraseBoost += 8

  // Retrieval score only; this is NOT a probability of diagnosis.
  return phraseBoost + overlap * 2 + coverage * 6
}

function formatHit(record: IndexedRecord, score: number): string {
  const lines = [
    `Candidate: ${record.name}${record.icd10 ? ` (ICD-10 ${record.icd10})` : ''}`,
    record.bodySystems.length ? `Body systems: ${record.bodySystems.join(', ')}` : '',
    record.description ? `Dataset description: ${record.description}` : '',
    record.executiveSummary ? `Synthetic teaching summary: ${record.executiveSummary}` : '',
  ].filter(Boolean)

  if (record.differentialDiagnosis.length) {
    lines.push(`Synthetic differential hints: ${record.differentialDiagnosis
      .map((item) => `${item.condition} — ${item.differentiating_factors}`)
      .join(' | ')}`)
  }
  if (record.commonMistakes.length) {
    lines.push(`Synthetic teaching pitfalls: ${record.commonMistakes
      .map((item) => `${item.mistake} — ${item.explanation}`)
      .join(' | ')}`)
  }
  if (record.pubmedRefs.length) {
    lines.push(`PubMed leads (existence/title verified by dataset publisher; claim support still requires checking): ${record.pubmedRefs
      .map((ref) => `PMID ${ref.pmid}${ref.year ? ` (${ref.year})` : ''}: ${ref.title}`)
      .join(' | ')}`)
  }
  lines.push(`Retrieval score: ${score.toFixed(2)} (ranking signal only, not diagnostic probability)`)
  return lines.join('\n')
}

export async function buildSyntheticClinicalContext(
  query: string,
  purpose: SyntheticClinicalPurpose,
  maxHits = DEFAULT_HITS,
): Promise<SyntheticClinicalGrounding | null> {
  if (!enabled()) return null
  const boundedQuery = cleanText(query, MAX_QUERY_CHARS)
  if (!boundedQuery) return null

  const index = await loadIndex()
  if (!index.length) return null

  const queryNorm = normalize(boundedQuery)
  const queryTokens = tokenize(boundedQuery)
  if (!queryTokens.size) return null

  const ranked = index
    .map((record) => ({ record, score: scoreRecord(record, queryNorm, queryTokens) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name))
    .slice(0, Math.max(1, Math.min(maxHits, 4)))

  if (!ranked.length) return null

  const header = [
    'SYNTHETIC CLINICAL RETRIEVAL — RESEARCH CONTEXT ONLY.',
    `Source: ${OPUS55_SOURCE.dataset} @ ${OPUS55_SOURCE.revision}.`,
    'Hard rules: this context is not patient truth and not clinical evidence. Never copy synthetic patient facts, vitals, labs, treatment doses, or scenario details into the current patient record. Never use it as the sole basis for diagnosis or treatment. Verify clinically material claims against authoritative/primary sources and preserve clinician review before any signed EMR content.',
    purpose === 'ai-emr'
      ? 'AI-EMR rule: only document facts present in the actual patient context/transcript; retrieved material may suggest questions or differentials but may not fill missing fields.'
      : 'Chatbot rule: use retrieved material only as a hypothesis/retrieval aid; distinguish evidence-backed facts from synthetic teaching hints.',
  ].join('\n')

  const sections: string[] = []
  let used = header.length
  for (const row of ranked) {
    const section = `\n\n---\n${formatHit(row.record, row.score)}`
    if (used + section.length > MAX_CONTEXT_CHARS) break
    sections.push(section)
    used += section.length
  }

  const usedRows = ranked.slice(0, sections.length)
  if (!usedRows.length) return null

  return {
    sourceId: OPUS55_SOURCE.id,
    revision: OPUS55_SOURCE.revision,
    truthClass: 'synthetic-research-context',
    purpose,
    hitCount: usedRows.length,
    hits: usedRows.map(({ record, score }) => ({
      name: record.name,
      icd10: record.icd10,
      score: Number(score.toFixed(2)),
    })),
    context: header + sections.join(''),
  }
}

export function resetSyntheticClinicalRagForTests(): void {
  cachedPath = ''
  cachedIndex = null
}
