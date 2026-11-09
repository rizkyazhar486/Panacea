// Sintesis bukti: murni dan deterministik (tanpa jaringan, tanpa Date.now(), tanpa Math.random()).
// Fail-closed: input tidak lengkap ditolak dengan alasan bernama; tidak ada nilai tebakan, tidak ada sitasi buatan,
// tidak ada garis bawah gabungan. Hasilnya adalah PENGELOMPOKAN beratribusi yang dapat diperiksa manusia.
import { isValidIsoTimestamp } from '../../../shared/kernel/isoTimestamp'
import {
  CERTAINTIES, SOURCE_KINDS, STANCES,
  type AttributedClaim, type AttributedTeaching, type Certainty, type ClaimRecord, type Rejection, type SourceKind,
  type SourceRecord, type StanceGroup, type SynthesisInput, type SynthesisResult,
} from '../model/types'

export const MAX_QUESTION_CHARS = 500
export const MAX_SOURCES = 100
export const MAX_CLAIMS = 200
export const MAX_TEXT_CHARS = 2000

/** Jenis sumber yang dihitung sebagai bukti; 'teaching' sengaja tidak termasuk. */
export const EVIDENCE_KINDS: readonly SourceKind[] = SOURCE_KINDS.filter((k) => k !== 'teaching')

export const SYNTHESIS_BOUNDARY =
  'Grouping of the supplied sources only. Not a verdict, diagnosis or recommendation; no source was added or inferred. Verify against the primary source. Teachings are shown separately and are never counted as clinical evidence.'

const reject = (reason: Rejection['reason'], detail: string): Rejection => ({ ok: false, reason, detail })
const nonEmpty = (v: unknown, max = MAX_TEXT_CHARS): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max
const RANK: Record<Certainty, number> = { high: 3, moderate: 2, low: 1, 'very-low': 0 }

export function synthesize(input: SynthesisInput): SynthesisResult {
  if (!input || typeof input !== 'object' || !Array.isArray(input.sources) || !Array.isArray(input.claims) || !Number.isFinite(input.nowMs)) {
    return reject('invalid-input', 'sources[], claims[] and a finite nowMs are required')
  }
  if (!nonEmpty(input.question, MAX_QUESTION_CHARS)) return reject('invalid-question', `question must be 1..${MAX_QUESTION_CHARS} characters`)
  if (input.sources.length > MAX_SOURCES) return reject('too-many-sources', `${input.sources.length} > ${MAX_SOURCES}`)
  if (input.claims.length > MAX_CLAIMS) return reject('too-many-claims', `${input.claims.length} > ${MAX_CLAIMS}`)
  if (input.claims.length === 0) return reject('no-claims', 'nothing to synthesize')

  const sources = new Map<string, SourceRecord>()
  for (const s of input.sources) {
    if (!s || typeof s !== 'object') return reject('source-incomplete', 'source is not an object')
    for (const f of ['id', 'title', 'identifier', 'licence'] as const) {
      if (!nonEmpty(s[f], 500)) return reject('source-incomplete', `source ${String(s.id)} is missing ${f}`)
    }
    if (!SOURCE_KINDS.includes(s.kind)) return reject('source-invalid-kind', `source ${s.id}: ${String(s.kind)}`)
    if (!isValidIsoTimestamp(s.retrievedAt)) return reject('source-invalid-retrieval', `source ${s.id}: retrievedAt must be ISO 8601 with a timezone`)
    if (Date.parse(s.retrievedAt) > input.nowMs) return reject('source-retrieved-in-future', `source ${s.id}`)
    if (s.kind === 'teaching' && !nonEmpty(s.lens, 300)) return reject('teaching-source-has-no-lens', `source ${s.id}: a teaching must name its tradition/lens`)
    if (sources.has(s.id)) return reject('duplicate-source-id', s.id)
    sources.set(s.id, s)
  }

  const groups: Record<'supports' | 'opposes' | 'neutral', AttributedClaim[]> = { supports: [], opposes: [], neutral: [] }
  const teachings: AttributedTeaching[] = []
  const seenClaims = new Set<string>()
  for (const c of input.claims as ClaimRecord[]) {
    if (!c || typeof c !== 'object' || !nonEmpty(c.id, 200) || !nonEmpty(c.text) || !STANCES.includes(c.stance)) return reject('claim-invalid', `claim ${String(c?.id)}`)
    if (seenClaims.has(c.id)) return reject('duplicate-claim-id', c.id)
    seenClaims.add(c.id)
    const source = sources.get(c.sourceId)
    if (!source) return reject('claim-unknown-source', `claim ${c.id} cites ${String(c.sourceId)}, which was not supplied`)
    if (source.kind === 'teaching') {
      // Ajaran tidak dinilai: tidak ada tingkat kepastian, tidak ikut sikap mendukung/menentang.
      if (c.certainty !== undefined) return reject('teaching-claim-has-certainty', `claim ${c.id}: teachings are attributed, not graded`)
      teachings.push({ claimId: c.id, text: c.text, source })
      continue
    }
    if (c.certainty === undefined || !CERTAINTIES.includes(c.certainty)) return reject('evidence-claim-missing-certainty', `claim ${c.id}`)
    groups[c.stance].push({ claimId: c.id, text: c.text, stance: c.stance, certainty: c.certainty, ...(c.population ? { population: c.population } : {}), source })
  }

  const order = (a: AttributedClaim, b: AttributedClaim) => RANK[b.certainty] - RANK[a.certainty] || (a.claimId < b.claimId ? -1 : a.claimId > b.claimId ? 1 : 0)
  const group = (list: AttributedClaim[]): StanceGroup => {
    const sorted = [...list].sort(order)
    return { claims: sorted, strongest: sorted.length ? sorted[0].certainty : null }
  }
  const supports = group(groups.supports)
  const opposes = group(groups.opposes)
  const neutral = group(groups.neutral)
  const graded = supports.claims.length + opposes.claims.length + neutral.claims.length

  const used = new Set<string>([...supports.claims, ...opposes.claims, ...neutral.claims].map((c) => c.source.id))
  const contestedSources = [...sources.values()].filter((s) => s.contested === true && (used.has(s.id) || teachings.some((t) => t.source.id === s.id))).map((s) => s.id).sort()
  const presentKinds = new Set<SourceKind>([...sources.values()].filter((s) => used.has(s.id)).map((s) => s.kind))

  return {
    ok: true,
    question: input.question.trim(),
    status: graded > 0 ? 'graded-evidence' : 'no-graded-evidence',
    supports, opposes, neutral,
    contested: (supports.claims.length > 0 && opposes.claims.length > 0) || contestedSources.length > 0,
    contestedSources,
    gaps: graded > 0 ? EVIDENCE_KINDS.filter((k) => !presentKinds.has(k)) : [...EVIDENCE_KINDS],
    teachings: teachings.sort((a, b) => (a.claimId < b.claimId ? -1 : a.claimId > b.claimId ? 1 : 0)),
    sourceCount: sources.size,
    truthClass: 'reference',
    boundary: SYNTHESIS_BOUNDARY,
  }
}
