// Review manusia OPSIONAL (docs/governance/HUMAN_VERIFICATION_OPTIONAL.md §3–§5, tugas T-HR-02). Fungsi murni: tanpa jam, acak atau I/O.
// Review ini sukarela, terbatas pada cakupannya, tidak pernah memberi otoritas (lisensi, persetujuan, validasi klinis), dan TIDAK boleh
// ditulis oleh AI. Riwayat hanya bertambah (append-only); penarikan adalah catatan baru, bukan penghapusan.

export const DECISIONS = ['approve', 'request_changes', 'defer', 'not_applicable'] as const
export type Decision = (typeof DECISIONS)[number]

/** Siapa yang mengirim. `ai-service` = permintaan yang membawa penanda agen AI; selalu ditolak (§3.5). */
export type Author = { kind: 'human'; userId?: string } | { kind: 'ai-service'; marker: string }

export type ReviewInput = {
  taskId: unknown; version: unknown; decision: unknown; scope: unknown
  reviewer?: { name?: unknown; role?: unknown; attributed?: unknown }
  checklist?: unknown; termsAccepted?: unknown
}

export type ReviewRecord = {
  id: string; type: 'review'; taskId: string; version: string; decision: Decision; scope: string
  reviewer: { name: string; role: string; attributed: boolean }
  checklist: Array<{ item: string; checked: boolean }>
  termsAccepted: true; createdAt: string; supersedes: string | null; authorUserId: string | null
}
export type WithdrawalRecord = { id: string; type: 'withdrawal'; taskId: string; supersedes: string; createdAt: string; authorUserId: string }
export type HumanReviewEntry = ReviewRecord | WithdrawalRecord

export type Rejection =
  | 'ai-author-forbidden' | 'terms-not-accepted' | 'invalid-task' | 'invalid-version' | 'invalid-decision' | 'missing-scope'
  | 'invalid-checklist' | 'attribution-incomplete' | 'possible-patient-data' | 'authority-claim' | 'unknown-supersedes'
  | 'supersedes-other-task' | 'not-withdrawable' | 'not-author' | 'already-withdrawn' | 'invalid-clock'
export type Result<T> = { ok: true; value: T } | { ok: false; reason: Rejection }

const TASK_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){1,6}$/
const VERSION = /^[0-9a-f]{7,40}$/
const MAX_TEXT = 500
const MAX_ITEMS = 30
// §3.8: review tidak boleh memuat data pasien. Pola konservatif: NIK 16 digit, nomor telepon, email, tanggal lahir, nomor rekam medis.
const PATIENT_DATA = [/\b\d{16}\b/, /(?:\+62|\b0)8\d{8,11}\b/, /[^\s@]+@[^\s@]+\.[^\s@]+/, /\b(?:tgl\.? lahir|tanggal lahir|date of birth|dob)\b/i, /\b(?:no\.? ?rm|mrn|medical record (?:number|no))\b/i]
// §3.4/§3.7: klaim otoritas yang tidak boleh lahir dari review sukarela.
const AUTHORITY = /\b(?:clinically validated|approved for (?:clinical )?use|compliant|certified|licensed|legal(?:ly)? approved|consent (?:given|granted))\b/i

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const leaks = (s: string) => PATIENT_DATA.some((re) => re.test(s))

/** Validasi satu review baru terhadap aturan §3–§4. `history` = log saat ini (untuk `supersedes`). */
export function createReview(input: ReviewInput, author: Author, history: readonly HumanReviewEntry[], at: string, id: string, supersedes: string | null = null): Result<ReviewRecord> {
  if (author.kind !== 'human') return { ok: false, reason: 'ai-author-forbidden' }
  if (!Number.isFinite(Date.parse(at))) return { ok: false, reason: 'invalid-clock' }
  if (input.termsAccepted !== true) return { ok: false, reason: 'terms-not-accepted' }
  const taskId = text(input.taskId), version = text(input.version), scope = text(input.scope)
  if (!TASK_ID.test(taskId)) return { ok: false, reason: 'invalid-task' }
  if (!VERSION.test(version)) return { ok: false, reason: 'invalid-version' }
  if (typeof input.decision !== 'string' || !(DECISIONS as readonly string[]).includes(input.decision)) return { ok: false, reason: 'invalid-decision' }
  if (!scope || scope.length > MAX_TEXT) return { ok: false, reason: 'missing-scope' }
  const raw = input.checklist ?? []
  if (!Array.isArray(raw) || raw.length > MAX_ITEMS) return { ok: false, reason: 'invalid-checklist' }
  const checklist: ReviewRecord['checklist'] = []
  for (const c of raw) {
    const item = text((c as { item?: unknown })?.item), checked = (c as { checked?: unknown })?.checked
    // hanya boolean asli; "true"/1 bukan centang (§3.5: tidak ada centang tersirat)
    if (!item || item.length > MAX_TEXT || typeof checked !== 'boolean') return { ok: false, reason: 'invalid-checklist' }
    checklist.push({ item, checked })
  }
  const name = text(input.reviewer?.name), role = text(input.reviewer?.role)
  // §4: attributed hanya dengan nama DAN peran; tanpa keduanya = umpan balik anonim (tidak bisa menaikkan label)
  if (input.reviewer?.attributed === true && (!name || !role)) return { ok: false, reason: 'attribution-incomplete' }
  if (name.length > 120 || role.length > 120) return { ok: false, reason: 'attribution-incomplete' }
  const attributed = input.reviewer?.attributed === true
  const freeText = [scope, name, role, ...checklist.map((c) => c.item)]
  if (freeText.some(leaks)) return { ok: false, reason: 'possible-patient-data' }
  if (AUTHORITY.test(scope)) return { ok: false, reason: 'authority-claim' }
  if (supersedes !== null) {
    const prev = history.find((e) => e.id === supersedes && e.type === 'review')
    if (!prev) return { ok: false, reason: 'unknown-supersedes' }
    if (prev.taskId !== taskId) return { ok: false, reason: 'supersedes-other-task' }
  }
  return { ok: true, value: { id, type: 'review', taskId, version, decision: input.decision as Decision, scope, reviewer: { name: attributed ? name : '', role: attributed ? role : '', attributed }, checklist, termsAccepted: true, createdAt: new Date(at).toISOString(), supersedes, authorUserId: author.userId ?? null } }
}

/** §3.9: penarikan = catatan baru. Hanya penulis terautentikasi yang sama; review anonim tidak dapat ditarik lewat API (tidak bisa dibuktikan pemiliknya). */
export function withdrawReview(reviewId: string, author: Author, history: readonly HumanReviewEntry[], at: string, id: string): Result<WithdrawalRecord> {
  if (author.kind !== 'human') return { ok: false, reason: 'ai-author-forbidden' }
  if (!Number.isFinite(Date.parse(at))) return { ok: false, reason: 'invalid-clock' }
  const prev = history.find((e): e is ReviewRecord => e.id === reviewId && e.type === 'review')
  if (!prev) return { ok: false, reason: 'unknown-supersedes' }
  if (!prev.authorUserId) return { ok: false, reason: 'not-withdrawable' }
  if (prev.authorUserId !== author.userId) return { ok: false, reason: 'not-author' }
  if (history.some((e) => e.type === 'withdrawal' && e.supersedes === reviewId)) return { ok: false, reason: 'already-withdrawn' }
  return { ok: true, value: { id, type: 'withdrawal', taskId: prev.taskId, supersedes: reviewId, createdAt: new Date(at).toISOString(), authorUserId: prev.authorUserId } }
}

/** Log append-only: mengembalikan salinan baru; catatan lama tidak pernah diubah atau dihapus. */
export const appendEntry = (log: readonly HumanReviewEntry[], entry: HumanReviewEntry): readonly HumanReviewEntry[] => {
  if (log.some((e) => e.id === entry.id)) throw new Error(`duplicate review id ${entry.id}`)
  return Object.freeze([...log, Object.freeze(structuredClone(entry))])
}

export type TaskLabel =
  | { status: 'none' }
  | { status: 'reviewed' | 'stale'; text: string; reviewId: string; version: string }
  | { status: 'anonymous-feedback-only'; count: number }

/** §3.6/§3.7: label yang boleh tampil. Hanya review attributed yang belum ditarik; usang bila versinya bukan versi saat ini. Tidak pernah kata otoritas. */
export function labelFor(log: readonly HumanReviewEntry[], taskId: string, currentVersion: string): TaskLabel {
  const withdrawn = new Set(log.filter((e) => e.type === 'withdrawal').map((e) => e.supersedes))
  const live = log.filter((e): e is ReviewRecord => e.type === 'review' && e.taskId === taskId && !withdrawn.has(e.id))
  const superseded = new Set(live.map((r) => r.supersedes).filter(Boolean))
  const attributed = live.filter((r) => r.reviewer.attributed && !superseded.has(r.id))
  const latest = attributed.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)
  if (!latest) return live.length ? { status: 'anonymous-feedback-only', count: live.length } : { status: 'none' }
  const decision = latest.decision.replace('_', ' ')
  return { status: latest.version === currentVersion ? 'reviewed' : 'stale', reviewId: latest.id, version: latest.version,
    text: `Reviewed by ${latest.reviewer.name} (${latest.reviewer.role}) on ${latest.createdAt.slice(0, 10)}: ${decision}. Scope: ${latest.scope}. Voluntary review; not a clinical, legal or licence approval.` }
}

// Penanda agen AI yang terlihat di permintaan. Tidak bisa membuktikan bahwa pengirim manusia; hanya menolak semua yang MENYATAKAN atau
// tampak sebagai agen (gagal tertutup). Review buatan AI yang lolos tetap bug menurut §3.5.
const AI_USER_AGENT = /(?:claude|anthropic|openai|chatgpt|gpt-?\d|gptbot|codex|copilot|gemini|bard|langchain|autogpt|headless|python-requests|curl\/|wget|node-fetch|undici|axios|deno|bun\/)|^node$|\bllm\b|\bmcp\b|\bai[- ]?agent\b|bot\b|crawler|spider/i
export type RequestSignals = { userAgent?: string; agentHeader?: string; usedMcpToken?: boolean; userId?: string }
export function classifyAuthor(s: RequestSignals): Author {
  if (s.usedMcpToken) return { kind: 'ai-service', marker: 'mcp-token' }
  if (s.agentHeader && s.agentHeader.trim()) return { kind: 'ai-service', marker: 'agent-header' }
  const ua = s.userAgent?.trim() ?? ''
  if (!ua) return { kind: 'ai-service', marker: 'no-user-agent' }
  if (AI_USER_AGENT.test(ua)) return { kind: 'ai-service', marker: 'agent-user-agent' }
  return s.userId ? { kind: 'human', userId: s.userId } : { kind: 'human' }
}
