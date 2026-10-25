// Katalog metadata tugas untuk antarmuka Review Manusia Opsional (T-HR-02)
// Menyediakan deskripsi, lingkup awal, dan tautan bukti read-only untuk tugas Panacea.

export interface TaskCatalogItem {
  taskId: string
  title: string
  lane: string
  horizon: 'H0' | 'H1' | 'H2' | 'H3' | 'GENERAL'
  description: string
  scopeRecommendation: string
  evidenceLinks: Array<{ label: string; href: string }>
  checklist: string[]
}

export const DEFAULT_CHECKLIST: string[] = [
  'The behaviour matches the task description',
  'It reads clearly on a phone (about 390 px wide)',
  'Keyboard / screen-reader use worked for what I tried',
  'I found no wrong, misleading or unsafe text',
  'Nothing looked like patient data being exposed',
]

export const KNOWN_TASKS: Record<string, TaskCatalogItem> = {
  'T-HR-02': {
    taskId: 'T-HR-02',
    title: 'In-Product Optional Human Review Interface',
    lane: 'claude',
    horizon: 'H0',
    description: 'Provides an in-product voluntary human verification interface at #/review/<taskId> per HUMAN_VERIFICATION_OPTIONAL §5. Implements append-only persistence, AI author rejection, and version binding without conferring clinical or legal authority.',
    scopeRecommendation: 'Tested review page layout, checklist controls, explicit terms acceptance, attributed vs anonymous feedback, and error handling at 390x844.',
    evidenceLinks: [
      { label: 'Specification (§3–§5)', href: 'docs/governance/HUMAN_VERIFICATION_OPTIONAL.md' },
      { label: 'Task Board', href: 'docs/governance/TASK_BOARD.md' },
      { label: 'Backend Domain Suite', href: 'server/uji/humanReview.uji.ts' },
    ],
    checklist: DEFAULT_CHECKLIST,
  },
  'T-H0-REPLAY-CAPTURE': {
    taskId: 'T-H0-REPLAY-CAPTURE',
    title: 'Human Replay Screenshot Capture Stabilization',
    lane: 'codex',
    horizon: 'H0',
    description: 'Stabilizes mobile/desktop visual evidence capture in Stabilization Acceptance by utilizing document-space bounded clipping with fullPage capture, avoiding WebGL animation locator stability timeouts.',
    scopeRecommendation: 'Verified panel capture screenshot renders correctly without clipping errors on 390x844 viewport.',
    evidenceLinks: [
      { label: 'Capture Helper', href: 'scripts/qa/human-replay-capture.mjs' },
      { label: 'Negative Controls', href: 'scripts/qa/human-replay-capture.test.mjs' },
    ],
    checklist: DEFAULT_CHECKLIST,
  },
  'T-H0-PARSER': {
    taskId: 'T-H0-PARSER',
    title: 'Server Parser Encoding 415 & Bounds Hardening',
    lane: 'codex',
    horizon: 'H0',
    description: 'Preserves HTTP 415 unsupported_media_type on unknown body encodings and charsets without leaking headers; verifies exact 12 MiB bounds and high-ratio decompression denial without disk mutations.',
    scopeRecommendation: 'Reviewed server error responses and verified privacy preservation across raw and compressed HTTP payloads.',
    evidenceLinks: [
      { label: 'Server Index', href: 'server/src/index.ts' },
      { label: 'Privacy HTTP Suite', href: 'server/uji/logPrivacyHttp.uji.ts' },
    ],
    checklist: DEFAULT_CHECKLIST,
  },
  'ENG-D7-02': {
    taskId: 'ENG-D7-02',
    title: 'Biomechanical Gait Measurability & Quality Gate',
    lane: 'claude',
    horizon: 'H2',
    description: 'Measures WALK and RUN clips for male and female rigged avatars against the 15 mm ground-contact threshold. Assesses forefoot contact on forefoot-strike running with heel recorded honestly as NOT_APPLICABLE.',
    scopeRecommendation: 'Inspected measurability report and confirmed honest rearfoot strike classification without synthetic stance phases.',
    evidenceLinks: [
      { label: 'Biomechanical Decision Analysis', href: 'docs/governance/ENG_D7_02_GAIT_DECISION_ANALYSIS.md' },
      { label: 'Gait Measurability Report', href: 'bodyexposure/qa_reports/gait_measurability.json' },
      { label: 'Acceptance V2 Contract', href: 'governance/ACCEPTANCE_V2.json' },
    ],
    checklist: DEFAULT_CHECKLIST,
  },
  'ENG-F2-01': {
    taskId: 'ENG-F2-01',
    title: 'WCAG AA Text Contrast Ratchet',
    lane: 'claude',
    horizon: 'H1',
    description: 'Maintains zero measurable text-contrast failures against WCAG AA standards across critical public and clinical pages in automated accessibility audits.',
    scopeRecommendation: 'Verified legibility of high-contrast text and interactive components across dark-mode palettes.',
    evidenceLinks: [
      { label: 'UX Audit Workflow', href: '.github/workflows/ux-audit-acceptance.yml' },
      { label: 'Axe Baseline Registry', href: 'governance/AXE_BASELINE.json' },
    ],
    checklist: DEFAULT_CHECKLIST,
  },
  'ENG-E4-02': {
    taskId: 'ENG-E4-02',
    title: 'Application Log PHI Zero-Leakage Gate',
    lane: 'codex',
    horizon: 'H1',
    description: 'Static and runtime verification that server logs carry zero names, emails, medical record numbers, clinical notes, or private identifiers across all RBAC routes.',
    scopeRecommendation: 'Audited log outputs from simulated clinical HTTP journeys to confirm complete identifier redaction.',
    evidenceLinks: [
      { label: 'Log Privacy Suite', href: 'server/uji/logPrivacyHttp.uji.ts' },
      { label: 'Console Request Guard', href: 'server/uji/support/consoleRequestGuard.ts' },
    ],
    checklist: DEFAULT_CHECKLIST,
  },
}

export function getTaskCatalogItem(taskId: string): TaskCatalogItem {
  const normalized = taskId.trim().toUpperCase()
  if (KNOWN_TASKS[normalized]) {
    return KNOWN_TASKS[normalized]
  }

  // Fallback untuk task ID kustom yang valid
  return {
    taskId: normalized,
    title: `Task ${normalized}`,
    lane: 'any-ai',
    horizon: normalized.startsWith('ENG-') ? 'H2' : 'GENERAL',
    description: `Voluntary human verification for task ${normalized}. Reviewers may attest matching behaviour, mobile legibility, or accessibility without conferring clinical or legal authority.`,
    scopeRecommendation: `Tested behaviour and mobile presentation for ${normalized}.`,
    evidenceLinks: [
      { label: 'Task Board', href: 'docs/governance/TASK_BOARD.md' },
      { label: 'Governance Overview', href: 'docs/governance/README.md' },
    ],
    checklist: DEFAULT_CHECKLIST,
  }
}
