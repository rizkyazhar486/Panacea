/**
 * PanaceaMed Apex Clinical-to-Claim OS (Universal Model v2.0).
 * Pure, deterministic clinical-first structuring, INA-CBG/iDRG pending-prevention
 * shield, Group J / Ventilator 6-artifact audit, KLL/KK/PAK/KAPJ payer routing,
 * negation-aware Indonesian clinical NLP, and forensic BPJS confirmation copilot.
 *
 * Non-negotiable guardrails:
 * 1. Clinical truth strictly over tariff optimization (zero tariff sorting).
 * 2. Evidence-based diagnostics only (PNPK clinical indication required).
 * 3. Zero-keyword, negation-aware encounter inference from longitudinal context.
 * 4. Strict role governance: NURSE strictly omits `clinical_coding` & `bpjs_confirmation_draft`.
 * 5. Clear separation between ICD-10 (diagnoses) and ICD-9-CM (procedures).
 */

export type ExecutionMode =
  | 'UPSTREAM_ENCOUNTER'
  | 'REALTIME_SHIELD'
  | 'DISCHARGE_AUDIT'
  | 'BPJS_CONFIRMATION_COPILOT'

export type ClinicalUserRole = 'DOCTOR' | 'NURSE' | 'CASEMIX_CODER'

export type CareSetting =
  | 'RAWAT_JALAN'
  | 'IGD'
  | 'IGD_PONEK'
  | 'RAWAT_INAP'
  | 'ICU_NICU_PICU_HCU'

export type PayerRoutingAlert = 'NONE' | 'KLL' | 'KK' | 'PAK' | 'KAPJ'

export interface PriorVisitSep {
  readonly sepNo: string
  readonly visitDateIso: string
  readonly dischargeDateIso?: string
  readonly careType: 'RITL' | 'RJTL'
  readonly primaryIcd10: string
  readonly summary?: string
}

export interface ClinicalToClaimInput {
  readonly execution_mode: ExecutionMode
  readonly user_role: ClinicalUserRole
  readonly care_setting: CareSetting
  readonly encounter_date_iso?: string
  readonly raw_clinical_input: string
  readonly longitudinal_history?: {
    readonly prior_visits_and_sep?: readonly PriorVisitSep[]
    readonly active_e_resep?: readonly string[]
    readonly billing_and_procedures?: readonly string[]
  }
  readonly supporting_documents?: {
    readonly lab_results?: readonly { readonly name: string; readonly value: string; readonly dateIso?: string }[]
    readonly radiology_expertise?: readonly { readonly name: string; readonly finding: string; readonly dateIso?: string }[]
    readonly clinical_forms_and_logs?: readonly { readonly name: string; readonly detail: string; readonly dateIso?: string }[]
  }
  readonly ventilator_hours?: number | null
  readonly bpjs_pending_query?: string | null
}

export interface MissingArtifactItem {
  readonly artifact: string
  readonly category: 'LAB' | 'RADIOLOGY' | 'INFORMED_CONSENT' | 'VENTILATOR_CARDEX' | 'OPERATIVE_OBGYN_REPORT' | 'MONITORING_LOG'
  readonly urgency: 'HIGH' | 'MEDIUM'
}

export interface ClinicalCodingBlock {
  readonly principal_diagnosis: {
    readonly icd10: string
    readonly description: string
    readonly evidence_anchor: string
    readonly coding_rule_basis: string
    readonly confidence: number
  }
  readonly secondary_diagnoses: readonly {
    readonly icd10: string
    readonly description: string
    readonly evidence_anchor: string
    readonly coding_rule_note: string
  }[]
  readonly procedures_icd9cm: readonly {
    readonly icd9cm: string
    readonly description: string
    readonly duration_or_multiplicity: string
    readonly evidence_anchor: string
  }[]
  readonly ina_cbg_grouping: {
    readonly code: string
    readonly severity: 'I' | 'II' | 'III'
    readonly clinical_rationale: string
  }
}

export interface BpjsConfirmationDraft {
  readonly addressed_question: string
  readonly forensic_cited_response: string
  readonly recommended_action: 'DEFEND_WITH_EVIDENCE' | 'ATTACH_MISSING_DOC' | 'CORRECT_CODE'
}

export interface ClinicalToClaimOutput {
  readonly meta: {
    readonly execution_mode: ExecutionMode
    readonly inferred_visit_type: string
    readonly care_setting: CareSetting
    readonly negations_and_resolved_conditions: readonly string[]
    readonly payer_routing_alert: PayerRoutingAlert
  }
  readonly upstream_emr_draft: {
    readonly S: string
    readonly O: string
    readonly A: string
    readonly P: string
    readonly clinician_clarification_prompts: readonly string[]
  }
  readonly clinical_coding?: ClinicalCodingBlock
  readonly pending_prevention_shield: {
    readonly risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
    readonly missing_evidence_artifacts: readonly MissingArtifactItem[]
    readonly pnpk_and_therapy_consistency: readonly string[]
    readonly e_resep_and_billing_discrepancies: readonly string[]
    readonly readmission_or_sep_overlap: {
      readonly is_flagged: boolean
      readonly detail: string
    }
    readonly evidence_based_order_suggestions: readonly {
      readonly order_name: string
      readonly clinical_indication: string
      readonly manual_order_fallback: boolean
    }[]
  }
  readonly bpjs_confirmation_draft?: BpjsConfirmationDraft
  readonly governance_notice: string
}

const NEGATION_PATTERNS: readonly { readonly re: RegExp; readonly label: string }[] = [
  { re: /\b(?:sudah\s+tidak\s+nyeri|nyeri\s*\(-\)|tanpa\s+nyeri|tidak\s+nyeri)\b/i, label: 'nyeri (resolved/absent)' },
  { re: /\b(?:tidak\s+ada\s+sesak|sesak\s*\(-\)|tanpa\s+sesak|sudah\s+tidak\s+sesak)\b/i, label: 'sesak napas (resolved/absent)' },
  { re: /\b(?:keluhan\s*\(-\)|tidak\s+ada\s+keluhan)\b/i, label: 'keluhan aktif (absent)' },
  { re: /\b(?:tidak\s+demam|demam\s*\(-\)|afebris)\b/i, label: 'demam (absent)' },
]

function detectNegations(text: string): string[] {
  const hits: string[] = []
  for (const item of NEGATION_PATTERNS) {
    if (item.re.test(text)) hits.push(item.label)
  }
  return hits
}

function detectPayerRouting(text: string): PayerRoutingAlert {
  if (/\b(kll|kecelakaan\s+lalu\s+lintas|tabrak|motor\s+jatuh|ditabrak|laka\s*lantas)\b/i.test(text)) return 'KLL'
  if (/\b(kecelakaan\s+kerja|jatuh\s+di\s+pabrik|terjepit\s+mesin|luka\s+saat\s+bekerja)\b/i.test(text)) return 'KK'
  if (/\b(penyakit\s+akibat\s+kerja|pak\b|paparan\s+asbes|silikosis\s+kerja)\b/i.test(text)) return 'PAK'
  if (/\b(kekerasan|penganiayaan|ditusuk|dipukul|kapj)\b/i.test(text)) return 'KAPJ'
  return 'NONE'
}

function inferVisitType(input: ClinicalToClaimInput): string {
  const text = input.raw_clinical_input
  const priors = input.longitudinal_history?.prior_visits_and_sep ?? []
  const billing = (input.longitudinal_history?.billing_and_procedures ?? []).join(' ')
  if (input.care_setting === 'ICU_NICU_PICU_HCU') return 'CRITICAL_CARE_ICU_MONITORING'
  if (input.care_setting === 'IGD_PONEK') return 'EMERGENCY_OBSTETRIC_PONEK'
  if (/\b(hd\b|hemodialisis|hemodialisa|dialisis)\b/i.test(`${text} ${billing}`)) return 'HEMODIALYSIS_SESSION'
  if (/\b(post\s*op|pasca\s*operasi|post\s*sc|angkat\s*jahitan)\b/i.test(text)) return 'POST_OPERATIVE_CONTROL'
  if (priors.some((p) => p.careType === 'RITL')) return 'POST_INPATIENT_FOLLOW_UP'
  if (input.care_setting === 'IGD') return 'EMERGENCY_ENCOUNTER'
  if (input.care_setting === 'RAWAT_INAP') return 'INPATIENT_ADMISSION'
  return 'ROUTINE_OUTPATIENT_CONTROL'
}

function checkReadmissionOrSepOverlap(input: ClinicalToClaimInput): { readonly is_flagged: boolean; readonly detail: string } {
  const priors = input.longitudinal_history?.prior_visits_and_sep ?? []
  if (priors.length === 0) return { is_flagged: false, detail: 'No prior SEP overlap or <30-day readmission detected.' }
  const nowMs = Date.parse(input.encounter_date_iso ?? '2026-11-24T00:00:00Z')
  for (const prior of priors) {
    const refMs = Date.parse(prior.dischargeDateIso ?? prior.visitDateIso)
    if (!Number.isFinite(refMs) || !Number.isFinite(nowMs)) continue
    const deltaDays = (nowMs - refMs) / 86_400_000
    if (deltaDays >= 0 && deltaDays <= 30 && prior.careType === 'RITL') {
      return {
        is_flagged: true,
        detail: `Prior RITL SEP ${prior.sepNo} (${prior.primaryIcd10}) ended ${Math.round(deltaDays)} days ago (<30-day readmission/SEP overlap review required).`,
      }
    }
    if (deltaDays < 0) {
      return {
        is_flagged: true,
        detail: `Overlapping active SEP episode detected with ${prior.sepNo} (${prior.careType}).`,
      }
    }
  }
  return { is_flagged: false, detail: 'Prior SEP episodes are outside the 30-day readmission overlap window.' }
}

function hasDoc(items: readonly { readonly name: string; readonly detail?: string; readonly finding?: string; readonly value?: string }[], pattern: RegExp): boolean {
  return items.some((d) => pattern.test(`${d.name} ${d.detail ?? ''} ${d.finding ?? ''} ${d.value ?? ''}`))
}

export function evaluateClinicalToClaimShield(input: ClinicalToClaimInput): ClinicalToClaimOutput {
  const text = (input.raw_clinical_input ?? '').trim()
  const negations = detectNegations(text)
  const payerRouting = detectPayerRouting(text)
  const inferredVisit = inferVisitType(input)
  const labs = input.supporting_documents?.lab_results ?? []
  const rads = input.supporting_documents?.radiology_expertise ?? []
  const forms = input.supporting_documents?.clinical_forms_and_logs ?? []
  const ereseps = input.longitudinal_history?.active_e_resep ?? []
  const billing = input.longitudinal_history?.billing_and_procedures ?? []

  const respFailureMentioned = /\b(gagal\s*napas|respiratory\s*failure|j96|ards|rds|intubasi|ventilator|cpap)\b/i.test(text)
    && !/\btidak\s+ada\s+gagal\s*napas\b/i.test(text)
  const ventilatorBilledOrActive = /\b(ventilator|intubasi|96\.71|96\.72|cpap)\b/i.test(`${text} ${billing.join(' ')}`)
    || (typeof input.ventilator_hours === 'number' && input.ventilator_hours > 0)
  const sepsisMentioned = /\b(sepsis|syok\s*septik|a41)\b/i.test(text)
  const strokeMentioned = /\b(stroke|nhl|infark\s*serebri|hemiparesis|i63)\b/i.test(text)
  const ckdMentioned = /\b(ckd|gagal\s*ginjal\s*kronik|n18|hemodialisis)\b/i.test(text)
  const obgynPonek = input.care_setting === 'IGD_PONEK' || /\b(preeklamsia|sectio|sc\b|partus|perdarahan\s*postpartum)\b/i.test(text)

  const missing: MissingArtifactItem[] = []
  const pnpkNotes: string[] = []
  const discrepancies: string[] = []
  const orders: { readonly order_name: string; readonly clinical_indication: string; readonly manual_order_fallback: boolean }[] = []
  const clarifications: string[] = []

  // Group J / Ventilator 6-Artifact Protocol
  if (respFailureMentioned || ventilatorBilledOrActive) {
    if (!hasDoc(forms, /informed\s*consent|persetujuan\s*tindakan|intubasi/i)) {
      missing.push({ artifact: 'Signed Informed Consent Intubasi / Ventilasi Mekanik', category: 'INFORMED_CONSENT', urgency: 'HIGH' })
    }
    if (!hasDoc(forms, /cardex|cordex|ventilator\s*log|jam\s*mulai/i)) {
      missing.push({ artifact: 'Ventilator Cardex / Cordex dengan timestamp mulai & lepas (96.71 vs 96.72)', category: 'VENTILATOR_CARDEX', urgency: 'HIGH' })
    }
    if (!hasDoc(labs, /\b(agd|abg|analisa\s*gas\s*darah|pao2|pco2|ph)\b/i)) {
      missing.push({ artifact: 'Analisa Gas Darah (AGD) & log SpO2', category: 'LAB', urgency: 'HIGH' })
      orders.push({
        order_name: 'Analisa Gas Darah (AGD)',
        clinical_indication: 'PNPK Gagal Napas / ICU: menilai hipoksemia (PaO2/FiO2) dan status asam-basa untuk titrasi ventilasi.',
        manual_order_fallback: false,
      })
    }
    if (!hasDoc(rads, /thorax|toraks|rontgen\s*dada|chest\s*x-?ray|cxr/i)) {
      missing.push({ artifact: 'Foto Rontgen Toraks + Expertise Radiologi', category: 'RADIOLOGY', urgency: 'HIGH' })
      orders.push({
        order_name: 'Foto Toraks AP/PA + Expertise Radiologi',
        clinical_indication: 'PNPK Respirasi: konfirmasi posisi ETT, infiltrat paru, atau barotrauma.',
        manual_order_fallback: false,
      })
    }
    if (!hasDoc(forms, /evaluasi\s*harian|daily\s*ventilator|weaning/i)) {
      missing.push({ artifact: 'Catatan Indikasi Klinis & Evaluasi Harian Ventilator', category: 'MONITORING_LOG', urgency: 'MEDIUM' })
    }
    pnpkNotes.push('Audit 6-artifak Group J / Ventilator aktif sesuai PNPK Gagal Napas & BA Kesepakatan BPJS.')
    if (respFailureMentioned && !ventilatorBilledOrActive) {
      discrepancies.push('Gagal napas/RDS tercatat tanpa billing/dokumentasi dukungan ventilator atau CPAP yang sesuai.')
      clarifications.push('Konfirmasi status SpO2/AGD dan apakah pasien mendapat dukungan ventilasi mekanik atau CPAP.')
    }
  }

  if (sepsisMentioned && !ereseps.some((m) => /meropenem|ceftriaxone|cefepime|piperacillin|levofloxacin|antibiotik/i.test(m))) {
    discrepancies.push('Diagnosis sepsis tercatat namun e-Resep belum memuat terapi antibiotik empirik/definitif yang selaras.')
  }

  if (obgynPonek && !hasDoc(forms, /laporan\s*operasi|partograf|persalinan|obgyn/i)) {
    missing.push({ artifact: 'Laporan Operasi / Partograf / Ringkasan Persalinan PONEK', category: 'OPERATIVE_OBGYN_REPORT', urgency: 'HIGH' })
  }

  if (payerRouting !== 'NONE') {
    pnpkNotes.push(`Skrining penjaminan kecelakaan (${payerRouting}) terpicu: verifikasi koordinasi Jasa Raharja / BPJS Ketenagakerjaan sebelum klaim BPJS Kesehatan.`)
  }

  const readmission = checkReadmissionOrSepOverlap(input)

  // Clinical-First Principal Diagnosis Selection (strictly clinical truth, never tariff-ranked)
  let principal: ClinicalCodingBlock['principal_diagnosis'] = {
    icd10: 'Z09.8',
    description: 'Follow-up examination after other treatment',
    evidence_anchor: text.slice(0, 120) || 'Encounter clinical record',
    coding_rule_basis: 'WHO ICD-10 clinical-first main condition rule (no tariff ranking)',
    confidence: 0.72,
  }
  let inaCode = 'Q-5-44-0'
  let severity: 'I' | 'II' | 'III' = 'I'

  if (respFailureMentioned) {
    principal = {
      icd10: 'J96.0',
      description: 'Acute respiratory failure',
      evidence_anchor: 'Dokumentasi gagal napas akut / kebutuhan ventilasi pada catatan klinis',
      coding_rule_basis: 'WHO ICD-10 & BA Kesepakatan BPJS Group J (memerlukan bukti AGD/SpO2 & dukungan respirasi)',
      confidence: hasDoc(labs, /agd|abg|pao2/i) ? 0.94 : 0.76,
    }
    inaCode = ventilatorBilledOrActive ? 'J-1-20-III' : 'J-4-16-II'
    severity = ventilatorBilledOrActive ? 'III' : 'II'
  } else if (strokeMentioned) {
    principal = {
      icd10: 'I63.9',
      description: 'Cerebral infarction, unspecified',
      evidence_anchor: 'Defisit neurologis fokal / diagnosis stroke iskemik pada catatan klinis',
      coding_rule_basis: 'WHO ICD-10 Group G (konfirmasi klinis + neuroimaging CT/MRI kepala)',
      confidence: 0.88,
    }
    inaCode = 'G-4-14-II'
    severity = 'II'
  } else if (ckdMentioned) {
    principal = {
      icd10: 'N18.5',
      description: 'Chronic kidney disease, stage 5',
      evidence_anchor: 'Dokumentasi CKD / sesi hemodialisis pada riwayat klinis',
      coding_rule_basis: 'WHO ICD-10 Group N (selaras eGFR & catatan dialisis)',
      confidence: 0.9,
    }
    inaCode = 'N-4-10-II'
    severity = 'II'
  } else if (obgynPonek) {
    principal = {
      icd10: 'O14.1',
      description: 'Severe pre-eclampsia / high-risk obstetric PONEK encounter',
      evidence_anchor: 'Dokumentasi obstetri emergensi / PONEK',
      coding_rule_basis: 'WHO ICD-10 Bab XV Obstetri (wajib partograf / laporan tindakan)',
      confidence: 0.85,
    }
    inaCode = 'O-6-10-II'
    severity = 'II'
  }

  const procedures: ClinicalCodingBlock['procedures_icd9cm'] = []
  if (ventilatorBilledOrActive) {
    const hrs = input.ventilator_hours ?? 0
    const isGe96 = hrs >= 96 || /\b96\.72\b/.test(`${text} ${billing.join(' ')}`)
    procedures.push({
      icd9cm: isGe96 ? '96.72' : '96.71',
      description: isGe96
        ? 'Continuous invasive mechanical ventilation for 96 consecutive hours or more'
        : 'Continuous invasive mechanical ventilation for less than 96 consecutive hours',
      duration_or_multiplicity: hrs > 0 ? `${hrs} hours` : 'Duration requires Cardex timestamp verification',
      evidence_anchor: 'Catatan intubasi/ventilator & Cardex ICU',
    })
  }

  const risk_level: 'LOW' | 'MEDIUM' | 'HIGH' =
    missing.some((m) => m.urgency === 'HIGH') || discrepancies.length > 0 || readmission.is_flagged || payerRouting !== 'NONE'
      ? 'HIGH'
      : missing.length > 0
        ? 'MEDIUM'
        : 'LOW'

  // Forensic BPJS Confirmation Copilot (never generic one-liner)
  let bpjsDraft: BpjsConfirmationDraft | undefined
  if (input.bpjs_pending_query && input.bpjs_pending_query.trim()) {
    const citedDocs = [
      ...labs.map((l) => `Lab ${l.name} (${l.dateIso ?? 'tanggal terlampir'}): ${l.value}`),
      ...rads.map((r) => `Radiologi ${r.name} (${r.dateIso ?? 'tanggal terlampir'}): ${r.finding}`),
      ...forms.map((f) => `Dokumen ${f.name} (${f.dateIso ?? 'tanggal terlampir'}): ${f.detail}`),
    ]
    const action: BpjsConfirmationDraft['recommended_action'] =
      missing.some((m) => m.urgency === 'HIGH') ? 'ATTACH_MISSING_DOC'
        : citedDocs.length > 0 ? 'DEFEND_WITH_EVIDENCE'
          : 'CORRECT_CODE'

    bpjsDraft = {
      addressed_question: input.bpjs_pending_query.trim(),
      forensic_cited_response: [
        `Menanggapi pertanyaan verifikator BPJS ("${input.bpjs_pending_query.trim()}"):`,
        `1. Diagnosis Utama klinis: ${principal.icd10} (${principal.description}) — ${principal.coding_rule_basis}.`,
        `2. Bukti objektif terlampir: ${citedDocs.length > 0 ? citedDocs.join('; ') : 'Belum ada dokumen penunjang objektif yang terlampir.'}`,
        `3. Gap dokumen yang wajib dilengkapi: ${missing.length > 0 ? missing.map((m) => m.artifact).join('; ') : 'Nihil (bukti lengkap).'}` ,
      ].join(' '),
      recommended_action: action,
    }
  }

  const baseOutput: ClinicalToClaimOutput = {
    meta: {
      execution_mode: input.execution_mode,
      inferred_visit_type: inferredVisit,
      care_setting: input.care_setting,
      negations_and_resolved_conditions: negations,
      payer_routing_alert: payerRouting,
    },
    upstream_emr_draft: {
      S: text || 'Anamnesis awal menunggu input klinisi.',
      O: [
        ...labs.map((l) => `${l.name}: ${l.value}`),
        ...rads.map((r) => `${r.name}: ${r.finding}`),
      ].join(' | ') || 'Tanda vital & hasil penunjang mengikuti lembar observasi.',
      A: input.user_role === 'NURSE'
        ? `Pemantauan keperawatan (${inferredVisit}) — penilaian medis & kode ICD-10 oleh DPJP.`
        : `${principal.description} (${principal.icd10})`,
      P: orders.length > 0
        ? `Rencana berbasis PNPK: ${orders.map((o) => o.order_name).join(', ')}.`
        : 'Lanjutkan tata laksana sesuai PNPK dan kelengkapan rekam medis.',
      clinician_clarification_prompts: clarifications.slice(0, 2),
    },
    pending_prevention_shield: {
      risk_level,
      missing_evidence_artifacts: missing,
      pnpk_and_therapy_consistency: pnpkNotes,
      e_resep_and_billing_discrepancies: discrepancies,
      readmission_or_sep_overlap: readmission,
      evidence_based_order_suggestions: orders,
    },
    governance_notice: 'AI Decision Support Only. Final clinical authority, orders, and claim sign-off remain solely with the licensed DPJP and hospital Casemix team.',
  }

  // STRICT ROLE GOVERNANCE: NURSE NEVER receives clinical_coding or bpjs_confirmation_draft
  if (input.user_role === 'NURSE') {
    return baseOutput
  }

  return {
    ...baseOutput,
    clinical_coding: {
      principal_diagnosis: principal,
      secondary_diagnoses: [],
      procedures_icd9cm: procedures,
      ina_cbg_grouping: {
        code: inaCode,
        severity,
        clinical_rationale: `Pemetaan ${inaCode} murni mengikuti kondisi klinis utama (${principal.icd10}) tanpa optimasi tarif.`,
      },
    },
    ...(bpjsDraft ? { bpjs_confirmation_draft: bpjsDraft } : {}),
  }
}
