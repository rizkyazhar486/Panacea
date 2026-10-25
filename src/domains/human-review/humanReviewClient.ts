// Client HTTP & domain adapter untuk Review Manusia Opsional (T-HR-02)
// Sesuai docs/governance/HUMAN_VERIFICATION_OPTIONAL.md §3–§5.
// Review sukarela, tidak pernah memberi otoritas (lisensi/persetujuan/validasi klinis), dan AI DILARANG menulis.

export const DECISIONS = ['approve', 'request_changes', 'defer', 'not_applicable'] as const
export type Decision = (typeof DECISIONS)[number]

export interface ReviewRecord {
  id: string
  type: 'review'
  taskId: string
  version: string
  decision: Decision
  scope: string
  reviewer: { name: string; role: string; attributed: boolean }
  checklist: Array<{ item: string; checked: boolean }>
  termsAccepted: true
  createdAt: string
  supersedes: string | null
}

export interface WithdrawalRecord {
  id: string
  type: 'withdrawal'
  taskId: string
  supersedes: string
  createdAt: string
}

export type HumanReviewEntry = ReviewRecord | WithdrawalRecord

export type TaskLabel =
  | { status: 'none' }
  | { status: 'reviewed' | 'stale'; text: string; reviewId: string; version: string }
  | { status: 'anonymous-feedback-only'; count: number }

export interface ReviewInput {
  taskId: string
  version: string
  decision: Decision
  scope: string
  reviewer?: { name?: string; role?: string; attributed?: boolean }
  checklist?: Array<{ item: string; checked: boolean }>
  termsAccepted: boolean
  supersedes?: string | null
}

export const TASK_ID_REGEX = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){1,6}$/
export const VERSION_REGEX = /^[0-9a-f]{7,40}$/
export const MAX_TEXT = 500
export const MAX_ITEMS = 30

// §3.8: Pola data pasien yang dilarang keras (NIK 16 digit, no telepon, email, tgl lahir, no rm).
export const PATIENT_DATA_PATTERNS = [
  /\b\d{16}\b/,
  /(?:\+62|\b0)8\d{8,11}\b/,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
  /\b(?:tgl\.? lahir|tanggal lahir|date of birth|dob)\b/i,
  /\b(?:no\.? ?rm|mrn|medical record (?:number|no))\b/i,
]

// §3.4/§3.7: Klaim otoritas yang dilarang lahir dari review sukarela.
export const AUTHORITY_PATTERNS = [
  /\b(?:clinically validated|approved for (?:clinical )?use|compliant|certified|licensed|legal(?:ly)? approved|consent (?:given|granted))\b/i,
]

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string }

export function validateReviewInput(input: ReviewInput): ValidationResult {
  const taskId = (input.taskId || '').trim()
  const version = (input.version || '').trim()
  const scope = (input.scope || '').trim()

  if (!TASK_ID_REGEX.test(taskId)) {
    return { valid: false, reason: 'invalid-task: Format Task ID harus seperti ENG-F2-01 atau T-HR-02' }
  }
  if (!VERSION_REGEX.test(version)) {
    return { valid: false, reason: 'invalid-version: Format commit SHA harus 7-40 karakter heksadesimal' }
  }
  if (!DECISIONS.includes(input.decision)) {
    return { valid: false, reason: 'invalid-decision: Keputusan harus salah satu dari: approve, request_changes, defer, not_applicable' }
  }
  if (!scope) {
    return { valid: false, reason: 'missing-scope: Lingkup (scope) review wajib diisi' }
  }
  if (scope.length > MAX_TEXT) {
    return { valid: false, reason: `scope-too-long: Lingkup melebihi batas ${MAX_TEXT} karakter` }
  }
  if (input.termsAccepted !== true) {
    return { valid: false, reason: 'terms-not-accepted: Ketentuan peninjauan sukarela wajib disetujui secara eksplisit' }
  }

  // Periksa data pasien pada teks lingkup dan data peninjau
  const allTexts = [scope, input.reviewer?.name || '', input.reviewer?.role || '']
  for (const text of allTexts) {
    for (const pattern of PATIENT_DATA_PATTERNS) {
      if (pattern.test(text)) {
        return { valid: false, reason: 'possible-patient-data: Teks terdeteksi memuat data identitas atau rekam medis pasien' }
      }
    }
    for (const pattern of AUTHORITY_PATTERNS) {
      if (pattern.test(text)) {
        return { valid: false, reason: 'authority-claim: Review sukarela dilarang mengklaim sertifikasi, lisensi, atau validasi klinis' }
      }
    }
  }

  // Validasi atribusi
  if (input.reviewer?.attributed) {
    const name = (input.reviewer.name || '').trim()
    const role = (input.reviewer.role || '').trim()
    if (!name || !role) {
      return { valid: false, reason: 'attribution-incomplete: Nama dan peran wajib diisi untuk atribusi review publik' }
    }
  }

  // Validasi checklist jika ada
  if (input.checklist) {
    if (input.checklist.length > MAX_ITEMS) {
      return { valid: false, reason: `checklist-too-long: Maksimal ${MAX_ITEMS} butir checklist` }
    }
    for (const item of input.checklist) {
      if (typeof item.checked !== 'boolean') {
        return { valid: false, reason: 'invalid-checklist: Status centang harus berupa nilai boolean eksplisit' }
      }
      if (!item.item || item.item.length > MAX_TEXT) {
        return { valid: false, reason: 'invalid-checklist: Teks butir checklist tidak boleh kosong atau melebihi batas' }
      }
    }
  }

  return { valid: true }
}

const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''

// Session in-memory cache untuk fallback offline/demo
const fallbackStore: Record<string, HumanReviewEntry[]> = {}

export function computeLabel(entries: HumanReviewEntry[], taskId: string, currentVersion: string): TaskLabel {
  const withdrawn = new Set(entries.filter((e): e is WithdrawalRecord => e.type === 'withdrawal').map((e) => e.supersedes))
  const live = entries.filter((e): e is ReviewRecord => e.type === 'review' && e.taskId === taskId && !withdrawn.has(e.id))
  const superseded = new Set(live.map((r) => r.supersedes).filter(Boolean))
  const attributed = live.filter((r) => r.reviewer.attributed && !superseded.has(r.id))
  const sorted = attributed.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : undefined

  if (!latest) {
    return live.length ? { status: 'anonymous-feedback-only', count: live.length } : { status: 'none' }
  }

  const decision = latest.decision.replace('_', ' ')
  return {
    status: latest.version === currentVersion ? 'reviewed' : 'stale',
    reviewId: latest.id,
    version: latest.version,
    text: `Reviewed by ${latest.reviewer.name} (${latest.reviewer.role}) on ${latest.createdAt.slice(0, 10)}: ${decision}. Scope: ${latest.scope}. Voluntary review; not a clinical, legal or licence approval.`,
  }
}

export async function fetchTaskReview(taskId: string, version = ''): Promise<{
  ok: boolean
  data?: { taskId: string; entries: HumanReviewEntry[]; label: TaskLabel }
  error?: string
}> {
  if (!TASK_ID_REGEX.test(taskId)) {
    return { ok: false, error: 'invalid-task' }
  }

  try {
    const url = `${API_BASE}/api/human-reviews/${encodeURIComponent(taskId)}${version ? `?version=${encodeURIComponent(version)}` : ''}`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (res.ok) {
      const data = await res.json()
      return { ok: true, data }
    }

    if (res.status === 404 || res.status === 502 || res.status === 503) {
      // Fallback in-memory
      const entries = fallbackStore[taskId] || []
      return { ok: true, data: { taskId, entries, label: computeLabel(entries, taskId, version) } }
    }

    const err = await res.json().catch(() => ({ error: 'fetch_failed' }))
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  } catch (_e) {
    // Offline fallback
    const entries = fallbackStore[taskId] || []
    return { ok: true, data: { taskId, entries, label: computeLabel(entries, taskId, version) } }
  }
}

export async function submitReview(input: ReviewInput): Promise<{
  ok: boolean
  review?: ReviewRecord
  error?: string
}> {
  const check = validateReviewInput(input)
  if (!check.valid) {
    return { ok: false, error: check.reason }
  }

  const body = {
    taskId: input.taskId.trim(),
    version: input.version.trim(),
    decision: input.decision,
    scope: input.scope.trim(),
    reviewer: input.reviewer?.attributed
      ? { name: (input.reviewer.name || '').trim(), role: (input.reviewer.role || '').trim(), attributed: true }
      : { name: '', role: '', attributed: false },
    checklist: (input.checklist || []).map((c) => ({ item: c.item.trim(), checked: Boolean(c.checked) })),
    termsAccepted: true,
    supersedes: input.supersedes || null,
  }

  try {
    const res = await fetch(`${API_BASE}/api/human-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.status === 201) {
      const data = await res.json()
      // Perbarui juga in-memory cache
      if (!fallbackStore[body.taskId]) fallbackStore[body.taskId] = []
      fallbackStore[body.taskId].push(data.review)
      return { ok: true, review: data.review }
    }

    const err = await res.json().catch(() => ({ error: 'submit_failed' }))
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  } catch (_e) {
    // Simulasi in-memory untuk mode offline/klien-murni
    const record: ReviewRecord = {
      id: `hr-client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'review',
      taskId: body.taskId,
      version: body.version,
      decision: body.decision,
      scope: body.scope,
      reviewer: body.reviewer,
      checklist: body.checklist,
      termsAccepted: true,
      createdAt: new Date().toISOString(),
      supersedes: body.supersedes,
    }
    if (!fallbackStore[body.taskId]) fallbackStore[body.taskId] = []
    fallbackStore[body.taskId].push(record)
    return { ok: true, review: record }
  }
}

export async function submitWithdrawal(reviewId: string, taskId: string): Promise<{
  ok: boolean
  withdrawal?: WithdrawalRecord
  error?: string
}> {
  try {
    const res = await fetch(`${API_BASE}/api/human-reviews/${encodeURIComponent(reviewId)}/withdraw`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    })

    if (res.status === 201) {
      const data = await res.json()
      if (fallbackStore[taskId]) fallbackStore[taskId].push(data.withdrawal)
      return { ok: true, withdrawal: data.withdrawal }
    }

    const err = await res.json().catch(() => ({ error: 'withdraw_failed' }))
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  } catch (_e) {
    const withdrawal: WithdrawalRecord = {
      id: `w-client-${Date.now()}`,
      type: 'withdrawal',
      taskId,
      supersedes: reviewId,
      createdAt: new Date().toISOString(),
    }
    if (fallbackStore[taskId]) fallbackStore[taskId].push(withdrawal)
    return { ok: true, withdrawal }
  }
}
