/**
 * Codemax Verifier SDK — Clinical-First Documentation, Coding & BPJS Pending-Claim Shield.
 * Grounded in PanaceaMed Clinical-to-Claim Shield v2.0 and RSUD dr. Slamet Garut / BitHealth
 * Codemax Workflow & March 2026 BPJS Pending Analysis.
 *
 * Non-negotiable safety invariants:
 * - Output is strictly draft decision support (`clinically_reviewed: false`, `billing_approved: false`).
 * - Never substitutes DPJP medical judgment or certified hospital Casemix coders.
 * - Clinical truth always outranks tariff grouping; unconfirmed malignancy never gets definitive primary C-code.
 */
import {
  evaluateClinicalToClaimShield,
  type CareSetting,
  type ClinicalUserRole,
  type PriorVisitSep,
} from './clinicalToClaimShieldEngine'

export const CODEMAX_NON_SUBSTITUTION_DISCLAIMER =
  'Codemax Verifier SDK bersifat pendukung keputusan dokumentasi & pengodean draf (clinically_reviewed = false, billing_approved = false). Hasil AI bukan pengganti keputusan klinis DPJP, koder casemix tersertifikasi, maupun ketentuan penjamin/BPJS.'

export interface CodemaxLabEvidence {
  readonly name: string
  readonly value: string
  readonly abnormal?: boolean
  readonly dateIso?: string
}

export interface CodemaxRadiologyEvidence {
  readonly name: string
  readonly finding: string
  readonly dateIso?: string
}

export interface CodemaxFormEvidence {
  readonly name: string
  readonly detail: string
  readonly dateIso?: string
}

export interface SoapToIcdRequest {
  readonly soapNote: string
  readonly careSetting: CareSetting
  readonly role: ClinicalUserRole
  readonly ventilatorHours?: number | null
  readonly ekgRecorded?: boolean
  readonly histopathologyConfirmed?: boolean
  readonly labs?: readonly CodemaxLabEvidence[]
  readonly radiology?: readonly CodemaxRadiologyEvidence[]
  readonly forms?: readonly CodemaxFormEvidence[]
  readonly priorVisits?: readonly PriorVisitSep[]
  readonly activeEresep?: readonly string[]
  readonly billingProcedures?: readonly string[]
  readonly bpjsPendingQuery?: string | null
  readonly encounterDateIso?: string
}

export interface IcdCandidate {
  readonly system: 'ICD-10' | 'ICD-9-CM'
  readonly code: string
  readonly description: string
  readonly roleInClaim: 'primary' | 'secondary' | 'procedure'
  readonly evidenceAnchor: string
  readonly evidenceStatus: 'supported' | 'unconfirmed_awaiting_histopath' | 'needs_supporting_doc'
  readonly confidence: number
}

export interface SoapToIcdResult {
  readonly draftOnly: true
  readonly clinically_reviewed: false
  readonly billing_approved: false
  readonly roleOmittedCoding: boolean
  readonly disclaimer: string
  readonly inferredVisitType: string
  readonly payerRoutingAlert: 'NONE' | 'KLL' | 'KK' | 'PAK' | 'KAPJ'
  readonly negationsDetected: readonly string[]
  readonly candidates: readonly IcdCandidate[]
  readonly clarificationPrompts: readonly string[]
  readonly shieldSummary: ReturnType<typeof evaluateClinicalToClaimShield>
}

export interface InaCbgRequest {
  readonly primaryIcd10: string
  readonly secondaryIcd10?: readonly string[]
  readonly proceduresIcd9cm?: readonly string[]
  readonly careSetting: CareSetting
  readonly soapNote?: string
  readonly labs?: readonly CodemaxLabEvidence[]
  readonly radiology?: readonly CodemaxRadiologyEvidence[]
  readonly forms?: readonly CodemaxFormEvidence[]
  readonly ekgRecorded?: boolean
  readonly histopathologyConfirmed?: boolean
  readonly ventilatorHours?: number | null
}

export interface InaCbgAnalysisResult {
  readonly draftOnly: true
  readonly clinically_reviewed: false
  readonly billing_approved: false
  readonly disclaimer: string
  readonly recommendedInaCbgs: readonly {
    readonly code: string
    readonly description: string
    readonly severity: 'I' | 'II' | 'III'
    readonly tariffSortApplied: false
    readonly clinicalRationale: string
  }[]
  readonly recommendedClaimDocuments: readonly {
    readonly documentName: string
    readonly status: 'present' | 'missing'
    readonly requiredFor: string
  }[]
  readonly recommendedDiagnosticOrders: readonly {
    readonly orderName: string
    readonly modality: 'LAB' | 'RADIOLOGY' | 'EKG' | 'PATHOLOGY'
    readonly clinicalIndication: string
    readonly draftOnly: true
  }[]
}

export type BpjsPendingCategory =
  | 'bukti_pelayanan_kurang'
  | 'kaidah_pengodean_klinis'
  | 'standar_pelayanan_belum_sesuai'
  | 'indikasi_ritl_tidak_tepat'
  | 'irisan_episode_atau_kll_kk_pak'

export type ConfirmationQualityGrade = 'Kosong' | 'Singkat/Umum' | 'Terperinci dengan Bukti Spesifik'

export interface BpjsPendingEvalInput {
  readonly soapToIcd: SoapToIcdResult
  readonly inaCbg: InaCbgAnalysisResult
  readonly confirmationDraftText: string
  readonly documentedRitlIndication?: boolean
  readonly priorVisits?: readonly PriorVisitSep[]
}

export interface BpjsPendingRiskReport {
  readonly draftOnly: true
  readonly clinically_reviewed: false
  readonly billing_approved: false
  readonly riskScore: number
  readonly riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  readonly flaggedCategories: readonly {
    readonly category: BpjsPendingCategory
    readonly label: string
    readonly detail: string
    readonly remediation: string
  }[]
  readonly confirmationQuality: ConfirmationQualityGrade
  readonly confirmationFeedback: string
  readonly disclaimer: string
}

export interface CodemaxDecisionAudit {
  readonly id: string
  readonly atIso: string
  readonly actorName: string
  readonly actorRole: ClinicalUserRole
  readonly targetCode: string
  readonly decision: 'accept' | 'reject' | 'manual_override'
  readonly overrideCode?: string
  readonly reason?: string
  readonly clinically_reviewed: false
  readonly billing_approved: false
}

export function analyzeSoapToIcd(input: SoapToIcdRequest): SoapToIcdResult {
  const shield = evaluateClinicalToClaimShield({
    execution_mode: input.bpjsPendingQuery?.trim() ? 'BPJS_CONFIRMATION_COPILOT' : 'REALTIME_SHIELD',
    user_role: input.role,
    care_setting: input.careSetting,
    encounter_date_iso: input.encounterDateIso,
    raw_clinical_input: input.soapNote,
    ventilator_hours: input.ventilatorHours,
    bpjs_pending_query: input.bpjsPendingQuery,
    supporting_documents: {
      lab_results: input.labs?.map((l) => ({ name: l.name, value: l.value, dateIso: l.dateIso })),
      radiology_expertise: input.radiology?.map((r) => ({ name: r.name, finding: r.finding, dateIso: r.dateIso })),
      clinical_forms_and_logs: input.forms?.map((f) => ({ name: f.name, detail: f.detail, dateIso: f.dateIso })),
    },
    longitudinal_history: {
      prior_visits_and_sep: input.priorVisits,
      active_e_resep: input.activeEresep,
      billing_and_procedures: input.billingProcedures,
    },
  })

  if (input.role === 'NURSE') {
    return {
      draftOnly: true,
      clinically_reviewed: false,
      billing_approved: false,
      roleOmittedCoding: true,
      disclaimer: CODEMAX_NON_SUBSTITUTION_DISCLAIMER,
      inferredVisitType: shield.meta.inferred_visit_type,
      payerRoutingAlert: shield.meta.payer_routing_alert,
      negationsDetected: shield.meta.negations_and_resolved_conditions,
      candidates: [],
      clarificationPrompts: shield.upstream_emr_draft.clinician_clarification_prompts,
      shieldSummary: shield,
    }
  }

  const text = input.soapNote.toLowerCase()
  const candidates: IcdCandidate[] = []
  const coding = shield.clinical_coding

  // Detect ENT/orbital mass or suspected malignancy before histology confirmation.
  const massMentioned = /\b(massa|tumor|neoplasma|nasofaring|orbita|proptosis|eviserasi)\b/i.test(text)
  if (massMentioned) {
    const confirmed = input.histopathologyConfirmed === true
    candidates.push({
      system: 'ICD-10',
      code: confirmed ? 'C11.9' : 'D48.9',
      description: confirmed
        ? 'Malignant neoplasm of nasopharynx, unspecified (histopathology confirmed)'
        : 'Neoplasm of uncertain behavior (suspected nasopharyngeal/orbital mass awaiting histopathology)',
      roleInClaim: 'primary',
      evidenceAnchor: 'Catatan klinis/pencitraan massa; konfirmasi PA menentukan keganasan definitif.',
      evidenceStatus: confirmed ? 'supported' : 'unconfirmed_awaiting_histopath',
      confidence: confirmed ? 0.91 : 0.74,
    })
  } else if (coding) {
    candidates.push({
      system: 'ICD-10',
      code: coding.principal_diagnosis.icd10,
      description: coding.principal_diagnosis.description,
      roleInClaim: 'primary',
      evidenceAnchor: coding.principal_diagnosis.evidence_anchor,
      evidenceStatus: shield.pending_prevention_shield.missing_evidence_artifacts.length > 0 ? 'needs_supporting_doc' : 'supported',
      confidence: coding.principal_diagnosis.confidence,
    })
  }

  if (/\b(takikardi|nadi\s*1[3-9]\d|hr\s*1[3-9]\d|r00\.0)\b/i.test(text)) {
    candidates.push({
      system: 'ICD-10',
      code: 'R00.0',
      description: 'Tachycardia, unspecified',
      roleInClaim: 'secondary',
      evidenceAnchor: 'Tanda vital nadi meningkat pada lembar observasi',
      evidenceStatus: input.ekgRecorded ? 'supported' : 'needs_supporting_doc',
      confidence: input.ekgRecorded ? 0.9 : 0.72,
    })
  }
  if (/\b(sgot|sgpt|transaminase|ast|alt)\b/i.test(text)) {
    candidates.push({
      system: 'ICD-10',
      code: 'R74.0',
      description: 'Nonspecific elevation of levels of transaminase and lactic acid dehydrogenase',
      roleInClaim: 'secondary',
      evidenceAnchor: 'Hasil laboratorium peningkatan SGOT/SGPT',
      evidenceStatus: 'supported',
      confidence: 0.88,
    })
  }
  if (/\b(eviserasi|evisceration)\b/i.test(text)) {
    candidates.push({
      system: 'ICD-9-CM',
      code: '16.39',
      description: 'Other evisceration of eyeball (procedure candidate — verify operative report)',
      roleInClaim: 'procedure',
      evidenceAnchor: 'Rencana / tindakan eviserasi pada catatan bedah mata',
      evidenceStatus: 'needs_supporting_doc',
      confidence: 0.78,
    })
  }
  for (const proc of coding?.procedures_icd9cm ?? []) {
    candidates.push({
      system: 'ICD-9-CM',
      code: proc.icd9cm,
      description: proc.description,
      roleInClaim: 'procedure',
      evidenceAnchor: proc.evidence_anchor,
      evidenceStatus: proc.duration_or_multiplicity.includes('verification') ? 'needs_supporting_doc' : 'supported',
      confidence: 0.86,
    })
  }

  return {
    draftOnly: true,
    clinically_reviewed: false,
    billing_approved: false,
    roleOmittedCoding: false,
    disclaimer: CODEMAX_NON_SUBSTITUTION_DISCLAIMER,
    inferredVisitType: shield.meta.inferred_visit_type,
    payerRoutingAlert: shield.meta.payer_routing_alert,
    negationsDetected: shield.meta.negations_and_resolved_conditions,
    candidates,
    clarificationPrompts: shield.upstream_emr_draft.clinician_clarification_prompts,
    shieldSummary: shield,
  }
}

export function analyzeIcdToInaCbg(input: InaCbgRequest): InaCbgAnalysisResult {
  const code = input.primaryIcd10.trim().toUpperCase() || 'Z09.8'
  const forms = input.forms ?? []
  const labs = input.labs ?? []
  const rads = input.radiology ?? []
  const hasDoc = (arr: readonly { readonly name: string; readonly detail?: string; readonly finding?: string; readonly value?: string }[], re: RegExp) =>
    arr.some((x) => re.test(`${x.name} ${x.detail ?? ''} ${x.finding ?? ''} ${x.value ?? ''}`))

  const isSevere = (input.secondaryIcd10?.length ?? 0) >= 2 || (input.ventilatorHours ?? 0) >= 96
  const severity: 'I' | 'II' | 'III' = isSevere ? 'III' : (input.secondaryIcd10?.length ?? 0) >= 1 ? 'II' : 'I'
  const prefix = code.startsWith('J96') ? 'J-1-20' : code.startsWith('D48') || code.startsWith('C') ? 'H-1-50' : code.startsWith('I63') ? 'G-4-14' : 'Q-5-44'

  const recommendedInaCbgs = [
    {
      code: `${prefix}-${severity}`,
      description: `Kelompok klinis utama ${code} (${input.careSetting}) — Severity Level ${severity}`,
      severity,
      tariffSortApplied: false as const,
      clinicalRationale: 'Dipetakan murni berdasarkan diagnosis klinis utama & komorbiditas terdokumentasi tanpa pengurutan tarif.',
    },
  ]

  const recommendedClaimDocuments = [
    {
      documentName: 'SEP & Surat Pengantar / Rujukan',
      status: hasDoc(forms, /\b(sep|rujukan|pengantar)\b/i) ? ('present' as const) : ('missing' as const),
      requiredFor: 'Validasi administratif & kesesuaian episode kunjungan',
    },
    {
      documentName: 'Resume Medis Ditandatangani DPJP',
      status: hasDoc(forms, /resume\s*medis|ringkasan\s*pulang/i) ? ('present' as const) : ('missing' as const),
      requiredFor: 'Bukti pelayanan utama & konsistensi diagnosis primer/sekunder',
    },
    {
      documentName: 'Laporan Tindakan / Operasi & Informed Consent',
      status: hasDoc(forms, /laporan\s*operasi|consent|persetujuan/i) ? ('present' as const) : ('missing' as const),
      requiredFor: 'Kaidah pengodean ICD-9-CM prosedur invasif/bedah',
    },
  ]

  const recommendedDiagnosticOrders: InaCbgAnalysisResult['recommendedDiagnosticOrders'][number][] = []
  if (input.ekgRecorded === false || (/\b(takikardi|nyeri\s*dada|acs|140)\b/i.test(input.soapNote ?? '') && !input.ekgRecorded)) {
    recommendedDiagnosticOrders.push({
      orderName: 'EKG 12-Lead Serial',
      modality: 'EKG',
      clinicalIndication: 'Evaluasi irama & iskemia pada takikardia / nyeri dada (belum tercatat di berkas).',
      draftOnly: true,
    })
  }
  if ((code.startsWith('D48') || code.startsWith('C')) && input.histopathologyConfirmed !== true) {
    recommendedDiagnosticOrders.push({
      orderName: 'Pemeriksaan Histopatologi / Biopsi PA',
      modality: 'PATHOLOGY',
      clinicalIndication: 'Konfirmasi jaringan definitif sebelum menetapkan kode neoplasma ganas primer.',
      draftOnly: true,
    })
  }
  if (labs.length === 0) {
    recommendedDiagnosticOrders.push({
      orderName: 'Panel Laboratorium Dasar (Darah Lengkap / Kimia Klinik sesuai indikasi)',
      modality: 'LAB',
      clinicalIndication: 'Bukti objektif pendukung keparahan & tata laksana klinis.',
      draftOnly: true,
    })
  }
  if (rads.length === 0 && /\b(massa|pneumonia|fraktur|stroke|orbita|nasofaring)\b/i.test(input.soapNote ?? '')) {
    recommendedDiagnosticOrders.push({
      orderName: 'Expertise Radiologi / Pencitraan (CT/MRI/Foto Toraks)',
      modality: 'RADIOLOGY',
      clinicalIndication: 'Konfirmasi lokasi anatomis, perluasan, dan kesesuaian kode ICD.',
      draftOnly: true,
    })
  }

  return {
    draftOnly: true,
    clinically_reviewed: false,
    billing_approved: false,
    disclaimer: CODEMAX_NON_SUBSTITUTION_DISCLAIMER,
    recommendedInaCbgs,
    recommendedClaimDocuments,
    recommendedDiagnosticOrders,
  }
}

export function evaluateBpjsPendingRisk(input: BpjsPendingEvalInput): BpjsPendingRiskReport {
  const flagged: BpjsPendingRiskReport['flaggedCategories'][number][] = []
  const missingDocs = input.inaCbg.recommendedClaimDocuments.filter((d) => d.status === 'missing')
  const shieldMissing = input.soapToIcd.shieldSummary.pending_prevention_shield.missing_evidence_artifacts

  if (missingDocs.length > 0 || shieldMissing.length > 0) {
    flagged.push({
      category: 'bukti_pelayanan_kurang',
      label: 'Tidak didukung bukti pelayanan',
      detail: `${missingDocs.length + shieldMissing.length} dokumen/penunjang penting belum terlampir.`,
      remediation: 'Lampirkan resume medis, expertise penunjang, serta laporan tindakan/cardex.',
    })
  }
  if (input.soapToIcd.candidates.some((c) => c.evidenceStatus === 'unconfirmed_awaiting_histopath' || c.evidenceStatus === 'needs_supporting_doc')) {
    flagged.push({
      category: 'kaidah_pengodean_klinis',
      label: 'Tidak sesuai kaidah pengodean klinis',
      detail: 'Terdapat kandidat kode yang masih memerlukan konfirmasi PA/EKG/penunjang.',
      remediation: 'Sesuaikan kode ICD-10/ICD-9-CM dengan bukti definitif dan aturan koding BPJS.',
    })
  }
  if (
    input.soapToIcd.shieldSummary.pending_prevention_shield.e_resep_and_billing_discrepancies.length > 0 ||
    input.inaCbg.recommendedDiagnosticOrders.length > 0
  ) {
    flagged.push({
      category: 'standar_pelayanan_belum_sesuai',
      label: 'Belum sesuai Standar Pelayanan / PNPK',
      detail: 'Terdapat ketidaksesuaian terapi-penunjang atau order penunjang esensial yang belum selesai.',
      remediation: 'Verifikasi indikasi klinis sesuai PPK/PNPK dan lengkapi hasil pemeriksaan wajib.',
    })
  }
  if (input.soapToIcd.shieldSummary.meta.care_setting === 'RAWAT_INAP' && input.documentedRitlIndication === false) {
    flagged.push({
      category: 'indikasi_ritl_tidak_tepat',
      label: 'Indikasi RITL tidak tepat',
      detail: 'Alasan klinis spesifik rawat inap belum tercantum tegas pada catatan masuk.',
      remediation: 'Dokumentasikan kriteria instabilitas hemodinamik/napas/nyeri berat yang mewajibkan RITL.',
    })
  }
  if (
    input.soapToIcd.shieldSummary.pending_prevention_shield.readmission_or_sep_overlap.is_flagged ||
    input.soapToIcd.payerRoutingAlert !== 'NONE'
  ) {
    flagged.push({
      category: 'irisan_episode_atau_kll_kk_pak',
      label: 'Rawat Inap berulang / Irisan Episode / KLL-KK-PAK',
      detail: input.soapToIcd.shieldSummary.pending_prevention_shield.readmission_or_sep_overlap.detail,
      remediation: 'Sertakan klarifikasi episode <30 hari atau surat koordinasi Jasa Raharja / BPJS TK.',
    })
  }

  const draft = input.confirmationDraftText.trim()
  const citesEvidence = /\b(tanggal|tgl|jam|lab|hasil|ekg|ct|mri|pa\b|resume|cardex|pao2|sgot|sgpt|nadi)\b/i.test(draft)
  const confirmationQuality: ConfirmationQualityGrade =
    draft.length === 0
      ? 'Kosong'
      : draft.length >= 60 && citesEvidence
        ? 'Terperinci dengan Bukti Spesifik'
        : 'Singkat/Umum'

  const baseScore = flagged.length * 18 + (confirmationQuality === 'Kosong' ? 15 : confirmationQuality === 'Singkat/Umum' ? 10 : 0)
  const riskScore = Math.min(100, baseScore)
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = riskScore >= 50 ? 'HIGH' : riskScore >= 20 ? 'MEDIUM' : 'LOW'

  return {
    draftOnly: true,
    clinically_reviewed: false,
    billing_approved: false,
    riskScore,
    riskLevel,
    flaggedCategories: flagged,
    confirmationQuality,
    confirmationFeedback:
      confirmationQuality === 'Terperinci dengan Bukti Spesifik'
        ? 'Draft jawaban sudah merujuk bukti klinis spesifik & tanggal pemeriksaan.'
        : 'Hindari jawaban umum/kosong; cantumkan nilai lab/radiologi, tanggal, & dasar klinis spesifik.',
    disclaimer: CODEMAX_NON_SUBSTITUTION_DISCLAIMER,
  }
}

export function recordCodemaxDecision(
  log: readonly CodemaxDecisionAudit[],
  entry: Omit<CodemaxDecisionAudit, 'id' | 'clinically_reviewed' | 'billing_approved'>,
): CodemaxDecisionAudit[] {
  if ((entry.decision === 'reject' || entry.decision === 'manual_override') && !(entry.reason ?? '').trim()) {
    throw new Error('Alasan wajib diisi saat menolak saran atau melakukan manual override Codemax.')
  }
  if (entry.decision === 'manual_override' && !(entry.overrideCode ?? '').trim()) {
    throw new Error('Kode ICD manual override wajib diisi.')
  }
  return [
    ...log,
    {
      ...entry,
      id: `cmx-${log.length + 1}`,
      clinically_reviewed: false,
      billing_approved: false,
    },
  ]
}
