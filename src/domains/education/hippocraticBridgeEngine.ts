/**
 * Pure deterministic Hippocratic Dual-Lens Educator Engine.
 *
 * Domain Purity Invariant:
 * - Zero DOM, Web Speech, storage, clock, RNG, or network calls.
 * - Preserves identical clinical facts across 3 synchronized literacy lenses
 *   (`plain_universal`, `patient_partner`, `clinician_brief`).
 * - Fails closed to emergency escalation for red-flag vitals/symptoms/PHQ-9 item 9.
 */

export type LiteracyLensId = 'plain_universal' | 'patient_partner' | 'clinician_brief'

export interface LabFindingInput {
  readonly name: string
  readonly valueText: string
  readonly unit?: string
  readonly status?: 'normal' | 'borderline' | 'high' | 'low' | 'critical'
  readonly loincCode?: string
}

export interface MedicationInput {
  readonly name: string
  readonly schedule?: string
  readonly purpose?: string
  readonly warningNote?: string
}

export interface HippocraticRecordInput {
  readonly topicTitle: string
  readonly language?: 'id' | 'en'
  readonly symptomSummary?: string
  readonly labFindings?: readonly LabFindingInput[]
  readonly medications?: readonly MedicationInput[]
  readonly diagnosisCode?: string
  readonly icd10?: string
  readonly icd11?: string
  readonly loincCodes?: readonly string[]
  readonly carePlan?: string
  readonly redFlagSymptoms?: readonly string[]
  readonly spo2Pct?: number | null
  readonly systolicMmHg?: number | null
  readonly phq9Item9Score?: number | null
  readonly consentConfirmed?: boolean
  readonly scopeId?: string
}

export interface PlainUniversalLens {
  readonly summary: string
  readonly analogy: string
  readonly whatToDoToday: readonly string[]
  readonly doNotDo: readonly string[]
  readonly redFlagErTrigger: string
  readonly speechSynthesisText: string
}

export interface PatientPartnerLens {
  readonly whyItWorks: string
  readonly expectedTimeline: string
  readonly normalSideEffects: string
  readonly warningSideEffects: string
  readonly questionsForDoctor: readonly [string, string, string]
}

export interface ClinicianBriefLens {
  readonly soapSummary: {
    readonly subjective: string
    readonly objective: string
    readonly assessment: string
    readonly planDraft: string
  }
  readonly codeAnchors: {
    readonly icd10: string | null
    readonly icd11: string | null
    readonly loinc: readonly string[]
  }
  readonly adherenceBarriers: readonly string[]
  readonly teachBackCheckpoints: readonly string[]
}

export interface HippocraticComplianceFlags {
  readonly beneficence: true
  readonly nonMaleficenceRedFlagChecked: true
  readonly autonomyConsentClear: boolean
  readonly confidentialityScoped: boolean
  readonly universalAccessFreeCore: true
}

export type HippocraticBridgeResult =
  | {
      readonly ok: true
      readonly topicTitle: string
      readonly language: 'id' | 'en'
      readonly redFlagDetected: boolean
      readonly emergencyEscalationRequired: boolean
      readonly redFlagReasons: readonly string[]
      readonly plain_universal: PlainUniversalLens
      readonly patient_partner: PatientPartnerLens
      readonly clinician_brief: ClinicianBriefLens
      readonly hippocraticCompliance: HippocraticComplianceFlags
      readonly truthClass: 'measured' | 'estimated' | 'curated_physiology'
      readonly clinicallyReviewed: false
      readonly epistemicNotice: string
    }
  | { readonly ok: false; readonly error: string }

const URGENT_PATTERN =
  /\b(nyeri\s*dada|chest\s*pain|sesak\s*berat|shortness\s*of\s*breath|dyspnea|stroke|wajah\s*miring|pelo|slurred\s*speech|pingsan|syncope|anaphylaxis|anafilaksis|perdarahan\s*hebat|uncontrolled\s*bleeding|suicid|bunuh\s*diri|self[- ]harm|kejang|seizure)\b/i

function capWords(raw: string, maxWords = 15): string {
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const words = clean.split(' ')
  if (words.length <= maxWords) return clean
  return `${words.slice(0, maxWords).join(' ').replace(/[.,;:!?]+$/, '')}.`
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

export function translateHippocraticBridge(input: HippocraticRecordInput): HippocraticBridgeResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Clinical bridge input must be an object.' }
  }
  const title = typeof input.topicTitle === 'string' ? input.topicTitle.trim() : ''
  if (!title) {
    return { ok: false, error: 'topicTitle is required for Hippocratic translation.' }
  }

  const lang: 'id' | 'en' = input.language === 'en' ? 'en' : 'id'
  const labs = Array.isArray(input.labFindings) ? input.labFindings : []
  const meds = Array.isArray(input.medications) ? input.medications : []
  const symptoms = typeof input.symptomSummary === 'string' ? input.symptomSummary.trim() : ''
  const redSymptomList = Array.isArray(input.redFlagSymptoms)
    ? input.redFlagSymptoms.map((s) => String(s).trim()).filter(Boolean)
    : []

  const redReasons: string[] = []
  if (redSymptomList.length > 0) {
    redReasons.push(...redSymptomList.slice(0, 3))
  }
  if (symptoms && URGENT_PATTERN.test(symptoms)) {
    redReasons.push(lang === 'id' ? 'Gejala tanda bahaya terdeteksi pada keluhan.' : 'Urgent red-flag symptom pattern noted.')
  }
  if (isFiniteNumber(input.spo2Pct) && input.spo2Pct < 90) {
    redReasons.push(lang === 'id' ? `Oksigen darah rendah (${input.spo2Pct}% < 90%).` : `Low oxygen saturation (${input.spo2Pct}% < 90%).`)
  }
  if (isFiniteNumber(input.systolicMmHg) && (input.systolicMmHg >= 180 || input.systolicMmHg < 85)) {
    redReasons.push(lang === 'id' ? `Tekanan darah krisis (${input.systolicMmHg} mmHg).` : `Critical systolic blood pressure (${input.systolicMmHg} mmHg).`)
  }
  if (isFiniteNumber(input.phq9Item9Score) && input.phq9Item9Score >= 1) {
    redReasons.push(
      lang === 'id'
        ? 'Skor keselamatan krisis emosional positif — butuh pendampingan segera.'
        : 'Positive crisis safety item — immediate human clinician support needed.',
    )
  }
  if (labs.some((l) => l.status === 'critical')) {
    redReasons.push(lang === 'id' ? 'Nilai lab kritis memerlukan evaluasi dokter segera.' : 'Critical laboratory finding requires urgent clinician review.')
  }

  const redFlagDetected = redReasons.length > 0
  const primaryMed = meds[0]
  const primaryLab = labs[0]

  const plainSummary = redFlagDetected
    ? capWords(
        lang === 'id'
          ? `${title}: ada tanda bahaya, segera ke IGD bersama keluarga.`
          : `${title}: urgent warning signs present, go to emergency room now.`,
      )
    : capWords(
        lang === 'id'
          ? `${title}: kondisi perlu dipantau tenang sesuai aturan dokter.`
          : `${title}: follow your doctor plan calmly and track daily signs.`,
      )

  const plainAnalogy = capWords(
    lang === 'id'
      ? primaryMed
        ? 'Obat bekerja seperti rem dan pelumas agar mesin tubuh stabil.'
        : 'Tubuh seperti rumah yang butuh aliran air dan udara lancar.'
      : primaryMed
        ? 'Medicine acts like steady brakes helping your body stay balanced.'
        : 'Your body works like a house needing steady flow and rest.',
  )

  const todoToday: string[] = [
    redFlagDetected
      ? capWords(
          lang === 'id'
            ? 'Ke IGD Sekarang atau hubungi layanan darurat terdekat.'
            : 'Go to ER now or call local emergency services.',
        )
      : capWords(
          primaryMed?.schedule
            ? lang === 'id'
              ? `Minum ${primaryMed.name} sesuai jadwal ${primaryMed.schedule}.`
              : `Take ${primaryMed.name} on schedule ${primaryMed.schedule}.`
            : lang === 'id'
              ? 'Ikuti rencana dokter, minum cukup air, dan catat keluhan.'
              : 'Follow clinician plan, hydrate well, and log symptoms.',
        ),
    capWords(
      primaryLab
        ? lang === 'id'
          ? `Simpan hasil ${primaryLab.name} ${primaryLab.valueText} untuk kontrol dokter.`
          : `Bring ${primaryLab.name} result ${primaryLab.valueText} to clinician visit.`
        : lang === 'id'
          ? 'Catat gejala harian agar dokter mudah menilai perkembangan.'
          : 'Note daily symptoms so your doctor tracks recovery clearly.',
    ),
  ]

  const doNotDo: string[] = [
    capWords(
      lang === 'id'
        ? 'Jangan ubah atau hentikan obat tanpa izin dokter.'
        : 'Do not change or stop medicines without doctor advice.',
    ),
    capWords(
      lang === 'id'
        ? 'Jangan menunda IGD jika napas berat atau dada nyeri.'
        : 'Do not delay emergency care for breathing trouble or chest pain.',
    ),
  ]

  const redFlagErTrigger = redFlagDetected
    ? capWords(
        lang === 'id'
          ? `Ke IGD Sekarang: ${redReasons[0]}`
          : `Go to ER Now: ${redReasons[0]}`,
      )
    : capWords(
        lang === 'id'
          ? 'Ke IGD bila nyeri dada, sesak berat, pingsan, atau lemas mendadak.'
          : 'Go to ER if chest pain, severe dyspnea, fainting, or sudden weakness.',
      )

  const speechSynthesisText = [plainSummary, plainAnalogy, ...todoToday, ...doNotDo, redFlagErTrigger]
    .filter(Boolean)
    .join(' ')

  const loincSet = new Set<string>(Array.isArray(input.loincCodes) ? input.loincCodes.filter(Boolean) : [])
  for (const lab of labs) {
    if (lab.loincCode) loincSet.add(lab.loincCode)
  }

  const labSummaryText = labs.length
    ? labs.map((l) => `${l.name}: ${l.valueText}${l.unit ? ` ${l.unit}` : ''}`).join('; ')
    : 'No laboratory panel supplied in this record.'

  const medSummaryText = meds.length
    ? meds.map((m) => `${m.name}${m.schedule ? ` (${m.schedule})` : ''}`).join(', ')
    : 'No active regimen listed.'

  const patientPartner: PatientPartnerLens = {
    whyItWorks: primaryMed?.purpose
      ? `${primaryMed.name} supports ${title} by ${primaryMed.purpose}. Never adjust dosing independently.`
      : `Structured monitoring for ${title} keeps symptoms, labs, and clinician follow-up aligned under one longitudinal record.`,
    expectedTimeline:
      input.carePlan?.trim() ||
      'Daily symptom trends typically guide clinician review within 48–72 hours or at your scheduled check-up.',
    normalSideEffects: primaryMed?.warningNote
      ? `Mild adjustment effects may occur while starting ${primaryMed.name}; monitor tolerance calmly.`
      : 'Mild fatigue or temporary fluctuation can occur; record timing and hydration.',
    warningSideEffects: redFlagDetected
      ? `ALERT: ${redReasons.join(' ')} Seek immediate in-person clinician or ER care.`
      : 'Escalate immediately for progressive chest discomfort, dyspnea, syncope, severe allergy signs, or neuro deficits.',
    questionsForDoctor: [
      `What is our concrete target outcome and next review date for ${title}?`,
      `Which symptoms mean I should seek urgent care before the scheduled follow-up?`,
      meds.length > 0
        ? `Are there food, supplement, or drug interactions with ${meds.map((m) => m.name).join(', ')}?`
        : `Which warning signs or home vitals should I record before our next visit?`,
    ],
  }

  const clinicianBrief: ClinicianBriefLens = {
    soapSummary: {
      subjective: symptoms || `Patient/caregiver education context for ${title}.`,
      objective: `${labSummaryText} · SpO2=${isFiniteNumber(input.spo2Pct) ? `${input.spo2Pct}%` : 'unobserved'} · SBP=${isFiniteNumber(input.systolicMmHg) ? `${input.systolicMmHg} mmHg` : 'unobserved'}`,
      assessment: redFlagDetected
        ? `${title} — RED FLAG PRESENT (${redReasons.join('; ')}); urgent physician/ER escalation required.`
        : `${title} — Educational bridge active; clinician review pending.`,
      planDraft:
        input.carePlan?.trim() ||
        `Verify regimen (${medSummaryText}), confirm red-flag return precautions, and complete patient teach-back.`,
    },
    codeAnchors: {
      icd10: input.icd10?.trim() || input.diagnosisCode?.trim() || null,
      icd11: input.icd11?.trim() || null,
      loinc: [...loincSet],
    },
    adherenceBarriers: [
      meds.length > 2 ? 'Regimen complexity (>2 concurrent medications)' : 'Schedule memory or caregiver alignment',
      lang === 'id' ? 'Literasi istilah medis teknis (pakai kalimat sederhana)' : 'Technical medical jargon barrier (use teach-back)',
    ],
    teachBackCheckpoints: [
      'Patient/caregiver can restate daily action in own words.',
      'Patient/caregiver can name at least 2 red-flag symptoms requiring urgent ER care.',
      'Follow-up window and active allergies verified prior to closure.',
    ],
  }

  const hasMeasuredVitalsOrLabs =
    labs.length > 0 || isFiniteNumber(input.spo2Pct) || isFiniteNumber(input.systolicMmHg)

  return {
    ok: true,
    topicTitle: title,
    language: lang,
    redFlagDetected,
    emergencyEscalationRequired: redFlagDetected,
    redFlagReasons: redReasons,
    plain_universal: {
      summary: plainSummary,
      analogy: plainAnalogy,
      whatToDoToday: todoToday,
      doNotDo,
      redFlagErTrigger,
      speechSynthesisText,
    },
    patient_partner: patientPartner,
    clinician_brief: clinicianBrief,
    hippocraticCompliance: {
      beneficence: true,
      nonMaleficenceRedFlagChecked: true,
      autonomyConsentClear: Boolean(input.consentConfirmed),
      confidentialityScoped: typeof input.scopeId === 'string' && input.scopeId.trim().length > 0,
      universalAccessFreeCore: true,
    },
    truthClass: hasMeasuredVitalsOrLabs ? 'measured' : 'curated_physiology',
    clinicallyReviewed: false,
    epistemicNotice:
      'Hippocratic dual-lens educational translation (clinically_reviewed=false). Supports doctor-patient understanding and fails closed to ER/clinician evaluation on red flags; never autonomous prescribing.',
  }
}
