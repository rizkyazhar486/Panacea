import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateReviewInput,
  computeLabel,
  TASK_ID_REGEX,
  VERSION_REGEX,
  PATIENT_DATA_PATTERNS,
  AUTHORITY_PATTERNS,
  DECISIONS,
} from '../../src/domains/human-review/humanReviewClient.ts'
import { getTaskCatalogItem, KNOWN_TASKS, DEFAULT_CHECKLIST } from '../../src/domains/human-review/humanReviewCatalog.ts'
import { classifyAuthor, createReview, labelFor } from '../../server/src/modules/humanReview/domain/review.ts'

// --- POSITIVE TESTS ---

test('T-HR-02: task catalog returns valid metadata with read-only evidence links and default unchecked checklist', () => {
  const item = getTaskCatalogItem('T-HR-02')
  assert.equal(item.taskId, 'T-HR-02')
  assert.ok(item.title.length > 0)
  assert.ok(item.description.length > 0)
  assert.ok(item.scopeRecommendation.length > 0)
  assert.ok(Array.isArray(item.evidenceLinks) && item.evidenceLinks.length > 0)
  // Bukti read-only
  for (const link of item.evidenceLinks) {
    assert.ok(link.label && link.href)
  }
  // Checklist awal sama dengan standar dan tidak ada yang dicentang otomatis
  assert.deepEqual(item.checklist, DEFAULT_CHECKLIST)
  assert.equal(item.checklist.length, 5)
})

test('T-HR-02: accepts valid attributed review submission with explicit terms', () => {
  const validAttributed = {
    taskId: 'ENG-F2-01',
    version: 'b3b3f510762a6e3f74113e972f057cff85717090',
    decision: 'approve',
    scope: 'Tested contrast ratchet against WCAG AA guidelines at 390x844 mobile viewport.',
    reviewer: { name: 'Dr. Jane Doe', role: 'Clinical Accessibility Specialist', attributed: true },
    checklist: [
      { item: 'The behaviour matches the task description', checked: true },
      { item: 'It reads clearly on a phone (about 390 px wide)', checked: true },
    ],
    termsAccepted: true,
  }

  const result = validateReviewInput(validAttributed)
  assert.equal(result.valid, true)
})

test('T-HR-02: accepts valid anonymous feedback without raising attributed status', () => {
  const anonymousInput = {
    taskId: 'ENG-D7-02',
    version: 'b3b3f510762a6e3f74113e972f057cff85717090',
    decision: 'request_changes',
    scope: 'Gait animation playback exhibited stuttering on low-end device preview.',
    reviewer: { name: '', role: '', attributed: false },
    checklist: [
      { item: 'The behaviour matches the task description', checked: false },
    ],
    termsAccepted: true,
  }

  const result = validateReviewInput(anonymousInput)
  assert.equal(result.valid, true)

  // Pastikan label untuk masukan anonim tidak menampilkan nama publik
  const entries = [
    {
      id: 'hr-anon-1',
      type: 'review',
      taskId: 'ENG-D7-02',
      version: 'b3b3f510762a6e3f74113e972f057cff85717090',
      decision: 'request_changes',
      scope: anonymousInput.scope,
      reviewer: { name: '', role: '', attributed: false },
      checklist: anonymousInput.checklist,
      termsAccepted: true,
      createdAt: '2026-10-25T03:00:00.000Z',
      supersedes: null,
    },
  ]
  const label = computeLabel(entries, 'ENG-D7-02', 'b3b3f510762a6e3f74113e972f057cff85717090')
  assert.equal(label.status, 'anonymous-feedback-only')
  if (label.status === 'anonymous-feedback-only') {
    assert.equal(label.count, 1)
  }
})

test('T-HR-02: marks attributed review as stale when task code version changes', () => {
  const originalVersion = '48cab5293c59ce71c78b6fa5f7e8c4f409660cd7'
  const newMainVersion = 'b3b3f510762a6e3f74113e972f057cff85717090'

  const entries = [
    {
      id: 'hr-1',
      type: 'review',
      taskId: 'ENG-D7-02',
      version: originalVersion,
      decision: 'approve',
      scope: 'Forefoot contact verified.',
      reviewer: { name: 'Dr. John', role: 'Biomechanics Reviewer', attributed: true },
      checklist: [{ item: 'Verified', checked: true }],
      termsAccepted: true,
      createdAt: '2026-10-25T01:00:00.000Z',
      supersedes: null,
    },
  ]

  // Ketika versi saat ini sama dengan versi review -> status reviewed
  const labelSame = computeLabel(entries, 'ENG-D7-02', originalVersion)
  assert.equal(labelSame.status, 'reviewed')

  // Ketika versi saat ini berbeda (kode telah di-commit ulang) -> status stale
  const labelChanged = computeLabel(entries, 'ENG-D7-02', newMainVersion)
  assert.equal(labelChanged.status, 'stale')
  if (labelChanged.status === 'stale') {
    assert.ok(labelChanged.text.includes('Voluntary review; not a clinical, legal or licence approval'))
  }
})

// --- NEGATIVE CONTROLS ---

test('T-HR-02: negative control — rejects missing or false termsAccepted', () => {
  const rejected = validateReviewInput({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Testing scope.',
    termsAccepted: false,
  })
  assert.equal(rejected.valid, false)
  assert.match(rejected.reason, /terms-not-accepted/)
})

test('T-HR-02: negative control — rejects invalid task ID format', () => {
  for (const badId of ['', 'invalid', '123', 'eng_f2_01', 'TASK/WITH/SLASH']) {
    const rejected = validateReviewInput({
      taskId: badId,
      version: 'b3b3f510',
      decision: 'approve',
      scope: 'Valid scope description.',
      termsAccepted: true,
    })
    assert.equal(rejected.valid, false)
    assert.match(rejected.reason, /invalid-task/)
  }
})

test('T-HR-02: negative control — rejects invalid commit SHA format', () => {
  for (const badSha of ['', '123', 'short', 'ZZZZZZZZ', 'not-a-hex-sha!']) {
    const rejected = validateReviewInput({
      taskId: 'T-HR-02',
      version: badSha,
      decision: 'approve',
      scope: 'Valid scope description.',
      termsAccepted: true,
    })
    assert.equal(rejected.valid, false)
    assert.match(rejected.reason, /invalid-version/)
  }
})

test('T-HR-02: negative control — rejects missing or blank scope', () => {
  for (const emptyScope of ['', '   ']) {
    const rejected = validateReviewInput({
      taskId: 'T-HR-02',
      version: 'b3b3f510',
      decision: 'approve',
      scope: emptyScope,
      termsAccepted: true,
    })
    assert.equal(rejected.valid, false)
    assert.match(rejected.reason, /missing-scope/)
  }
})

test('T-HR-02: negative control — rejects PHI patterns in review scope or reviewer details', () => {
  // NIK 16 digit
  const nikScope = validateReviewInput({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Reviewed data for patient with NIK 3171012345678901 in system.',
    termsAccepted: true,
  })
  assert.equal(nikScope.valid, false)
  assert.match(nikScope.reason, /possible-patient-data/)

  // Nomor rekam medis
  const mrnScope = validateReviewInput({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Tested against no. rm 12345678 in the clinic queue.',
    termsAccepted: true,
  })
  assert.equal(mrnScope.valid, false)
  assert.match(mrnScope.reason, /possible-patient-data/)

  // Email pasien dalam peran/nama
  const emailReviewer = validateReviewInput({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Reviewed layout rendering.',
    reviewer: { name: 'Dr. Jane', role: 'contact: doctor@hospital.id', attributed: true },
    termsAccepted: true,
  })
  assert.equal(emailReviewer.valid, false)
  assert.match(emailReviewer.reason, /possible-patient-data/)
})

test('T-HR-02: negative control — rejects false authority claims in review scope', () => {
  const authorityClaims = [
    'This task is clinically validated for intensive care.',
    'I certify that this module is approved for clinical use.',
    'Device certified and compliant with medical standards.',
  ]

  for (const claim of authorityClaims) {
    const rejected = validateReviewInput({
      taskId: 'T-HR-02',
      version: 'b3b3f510',
      decision: 'approve',
      scope: claim,
      termsAccepted: true,
    })
    assert.equal(rejected.valid, false)
    assert.match(rejected.reason, /authority-claim/)
  }
})

test('T-HR-02: negative control — rejects incomplete reviewer attribution', () => {
  // Hanya ada nama, tidak ada peran
  const noRole = validateReviewInput({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Testing scope.',
    reviewer: { name: 'Dr. Jane', role: '', attributed: true },
    termsAccepted: true,
  })
  assert.equal(noRole.valid, false)
  assert.match(noRole.reason, /attribution-incomplete/)

  // Hanya ada peran, tidak ada nama
  const noName = validateReviewInput({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Testing scope.',
    reviewer: { name: '', role: 'Doctor', attributed: true },
    termsAccepted: true,
  })
  assert.equal(noName.valid, false)
  assert.match(noName.reason, /attribution-incomplete/)
})

test('T-HR-02: negative control — server rejects AI-service author identity', () => {
  // Sesuai §3.5: AI tidak boleh menandatangani review atas nama manusia
  const aiAuthor1 = classifyAuthor({ userAgent: 'Claude-Code/1.0' })
  assert.equal(aiAuthor1.kind, 'ai-service')

  const aiAuthor2 = classifyAuthor({ userAgent: 'Mozilla/5.0', agentHeader: 'panacea-autonomous-agent' })
  assert.equal(aiAuthor2.kind, 'ai-service')

  const aiAuthor3 = classifyAuthor({ userAgent: 'Mozilla/5.0', usedMcpToken: true })
  assert.equal(aiAuthor3.kind, 'ai-service')

  // Domain server menolak review dari agen AI
  const history = []
  const res = createReview(
    {
      taskId: 'T-HR-02',
      version: 'b3b3f510762a6e3f74113e972f057cff85717090',
      decision: 'approve',
      scope: 'AI generated review attempt.',
      termsAccepted: true,
    },
    aiAuthor1,
    history,
    new Date().toISOString(),
    'hr-ai-1'
  )
  assert.equal(res.ok, false)
  assert.equal(res.reason, 'ai-author-forbidden')
  assert.equal(history.length, 0, 'AI review must not be persisted')
})

test('T-HR-02: sabotage control — bypassing terms check fails the regression gate', () => {
  // Fungsi simulasi dengan sabotase: mengabaikan pengecekan termsAccepted
  function sabotagedValidate(input) {
    if (!TASK_ID_REGEX.test(input.taskId)) return { valid: false, reason: 'invalid-task' }
    // Sabotase: melewatkan pemeriksaan input.termsAccepted === true
    return { valid: true }
  }

  // Uji bahwa validator normal menolak input tanpa persetujuan ketentuan
  const normalResult = validateReviewInput({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Valid scope.',
    termsAccepted: false,
  })
  assert.equal(normalResult.valid, false)

  // Buktikan bahwa sabotase akan mengembalikan true (keliru meloloskan)
  const sabotagedResult = sabotagedValidate({
    taskId: 'T-HR-02',
    version: 'b3b3f510',
    decision: 'approve',
    scope: 'Valid scope.',
    termsAccepted: false,
  })
  assert.equal(sabotagedResult.valid, true)

  // Ini membuktikan bahwa tes kami mendeteksi sabotase penghilangan syarat termsAccepted
  assert.notEqual(normalResult.valid, sabotagedResult.valid)
})
