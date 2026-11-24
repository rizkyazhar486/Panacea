/**
 * Contributor & Verifier Knowledge Governance Engine + Role Boundary Enforcer (Part VII).
 * - Enforces strict role isolation (`kontributor` NEVER accesses `patient_record`).
 * - Runs automated checks (citation, COI, license, PHI-leak guard, clinical safety guard).
 * - Hard invariant: AI actors can NEVER grant `Clinically reviewed` status.
 * - Side-by-side diff and contradiction detection between proposed updates and canonical entries.
 */

export type ContributionKind =
  | 'knowledge_note'
  | 'medication_formulary'
  | 'vaccine_schedule'
  | 'calculator'
  | 'emr_template'
  | 'facility_template'

export type ContributionLifecycleStage =
  | 'Draft'
  | 'Submitted'
  | 'Automated Checks'
  | 'Revision Required'
  | 'Verification'
  | 'Published'
  | 'Rejected'
  | 'Superseded'
  | 'Expired'

export type EvidenceVerificationStatus =
  | 'Unverified'
  | 'Automatically checked'
  | 'Technically verified'
  | 'Evidence-supported'
  | 'Clinically reviewed'
  | 'Rejected'
  | 'Superseded'
  | 'Expired'

export interface ContributionSubmission {
  readonly id: string
  readonly kind: ContributionKind
  readonly title: string
  readonly bodySummary: string
  readonly structuredFields: Readonly<Record<string, string>>
  readonly citation: string
  readonly conflictOfInterest: string
  readonly license: string
  readonly authorName: string
  readonly authorRole: string
  readonly stage: ContributionLifecycleStage
  readonly verificationStatus: EvidenceVerificationStatus
}

export interface AutomatedCheckReport {
  readonly passedAll: boolean
  readonly phiLeakDetected: boolean
  readonly unsafeClaimDetected: boolean
  readonly missingGovernanceFields: readonly string[]
  readonly findings: readonly string[]
}

const PHI_PATTERNS: readonly RegExp[] = [
  /\b\d{16}\b/, // Indonesian 16-digit NIK
  /\b(?:RM|MRN)[-:\s]*\d{5,}\b/i,
  /\b(?:\+62|08)\d{8,12}\b/, // Phone numbers
  /\b(?:Ny\.|Tn\.|Nn\.|Sdr\.)\s+[A-Z][a-z]{2,}\b/,
]

const UNSAFE_CLAIM_PATTERNS: readonly RegExp[] = [
  /\bauto[-\s]*prescribe\b/i,
  /\b100%\s*(?:cure|sembuh|pasti\s*aman)\b/i,
  /\btanpa\s+perlu\s+dokter\b/i,
]

export function runAutomatedContributionChecks(sub: ContributionSubmission): AutomatedCheckReport {
  const fullText = `${sub.title} ${sub.bodySummary} ${Object.values(sub.structuredFields).join(' ')}`
  const phiLeakDetected = PHI_PATTERNS.some((re) => re.test(fullText))
  const unsafeClaimDetected = UNSAFE_CLAIM_PATTERNS.some((re) => re.test(fullText))
  const missingGovernanceFields: string[] = []
  if (!sub.citation.trim() || sub.citation.trim().length < 8) missingGovernanceFields.push('Referensi / Sitasi Terverifikasi')
  if (!sub.conflictOfInterest.trim()) missingGovernanceFields.push('Deklarasi Conflict of Interest (COI)')
  if (!sub.license.trim()) missingGovernanceFields.push('Metadata Lisensi / Hak Cipta')

  const findings: string[] = []
  if (phiLeakDetected) findings.push('DITOLAK: Terdeteksi pola data pasien/PHI (NIK/MRN/Telepon/Nama Pasien) di materi kontribusi publik.')
  if (unsafeClaimDetected) findings.push('DITOLAK: Klaim peresepan otomatis atau jaminan kesembuhan absolut melanggar batas keselamatan.')
  for (const m of missingGovernanceFields) findings.push(`Belum lengkap: ${m}.`)

  return {
    passedAll: !phiLeakDetected && !unsafeClaimDetected && missingGovernanceFields.length === 0,
    phiLeakDetected,
    unsafeClaimDetected,
    missingGovernanceFields,
    findings,
  }
}

export function assertRoleDataBoundary(
  actorRole: string,
  resourceType: 'patient_record' | 'knowledge_submission' | 'verification_decision',
): { readonly allowed: boolean; readonly statusCode: 200 | 403; readonly reason?: string } {
  if (actorRole === 'kontributor' && resourceType === 'patient_record') {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Akses ditolak (403): Akun Kontributor tidak pernah memiliki akses ke rekam medis pasien.',
    }
  }
  if (resourceType === 'verification_decision' && actorRole !== 'verifikator' && actorRole !== 'dokter' && actorRole !== 'owner') {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Akses ditolak (403): Hanya Verifikator/Klinisi Spesialis yang berhak memutus antrean bukti.',
    }
  }
  return { allowed: true, statusCode: 200 }
}

export function applyVerificationDecision(
  sub: ContributionSubmission,
  decision: {
    readonly actorKind: 'ai' | 'human_specialist'
    readonly actorName: string
    readonly credentialId?: string
    readonly targetStatus: EvidenceVerificationStatus
    readonly note: string
    readonly checksReport: AutomatedCheckReport
  },
): { readonly ok: true; readonly updated: ContributionSubmission } | { readonly ok: false; readonly code: string; readonly error: string } {
  if (decision.actorKind === 'ai' && decision.targetStatus === 'Clinically reviewed') {
    return {
      ok: false,
      code: 'AI_CANNOT_GRANT_CLINICAL_REVIEW',
      error: 'Invarian keras: Aktor AI tidak boleh memberikan status Clinically reviewed. Wajib tinjauan manusia berkredensial.',
    }
  }
  if (decision.targetStatus === 'Clinically reviewed' && !(decision.credentialId ?? '').trim()) {
    return {
      ok: false,
      code: 'MISSING_VERIFIER_CREDENTIAL',
      error: 'Status Clinically reviewed memerlukan ID kredensial spesialis/subspesialis verifikator.',
    }
  }
  if (!decision.checksReport.passedAll && (decision.targetStatus === 'Clinically reviewed' || decision.targetStatus === 'Evidence-supported')) {
    return {
      ok: false,
      code: 'AUTOMATED_CHECKS_FAILED',
      error: 'Kontribusi gagal lolos pemeriksaan otomatis (PHI/sitasi/COI/lisensi); kembalikan untuk revisi.',
    }
  }
  const nextStage: ContributionLifecycleStage =
    decision.targetStatus === 'Rejected'
      ? 'Rejected'
      : decision.targetStatus === 'Expired'
        ? 'Expired'
        : decision.targetStatus === 'Superseded'
          ? 'Superseded'
          : decision.targetStatus === 'Clinically reviewed' || decision.targetStatus === 'Evidence-supported'
            ? 'Published'
            : 'Verification'

  return {
    ok: true,
    updated: {
      ...sub,
      stage: nextStage,
      verificationStatus: decision.targetStatus,
    },
  }
}

export interface DiffContradictionReport {
  readonly diffs: readonly { readonly field: string; readonly existing: string; readonly proposed: string; readonly change: 'added' | 'changed' | 'unchanged' }[]
  readonly contradictions: readonly string[]
}

export function detectContradictionsAndDiff(
  proposed: Readonly<Record<string, string>>,
  existingCanonical: Readonly<Record<string, string>>,
): DiffContradictionReport {
  const keys = Array.from(new Set([...Object.keys(existingCanonical), ...Object.keys(proposed)]))
  const diffs: DiffContradictionReport['diffs'][number][] = []
  const contradictions: string[] = []

  for (const key of keys) {
    const oldVal = (existingCanonical[key] ?? '').trim()
    const newVal = (proposed[key] ?? '').trim()
    const change = !oldVal && newVal ? 'added' : oldVal !== newVal ? 'changed' : 'unchanged'
    diffs.push({ field: key, existing: oldVal || '—', proposed: newVal || '—', change })

    if (oldVal && newVal && oldVal !== newVal && /\b(dose|dosis|max|maks|cutoff|ambang|route|rute)\b/i.test(key)) {
      contradictions.push(`Kontradiksi terdeteksi pada "${key}": kanonik "${oldVal}" vs usulan "${newVal}".`)
    }
  }
  return { diffs, contradictions }
}
