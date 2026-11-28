/**
 * Subspecialist Clinical Documentation Engine, Deterministic Anthropometry / Fluid
 * Calculators, and Quick Consult Auto-Formatter (Part IV & Part V, §19–§20).
 *
 * Strict clinical & epistemic safeguards:
 * - Never coerce blank/missing numbers to 0.
 * - Never compute pediatric WHO/CDC weight-for-age / height-for-age Z-scores for adults (>= 18 th); return N/A_ADULT.
 * - Never fabricate missing EKG, histopathology, or undocumented physical exams; mark missing history as "belum dikaji".
 * - Separate already-administered interventions from AI draft proposals (`clinically_reviewed: false`).
 * - Never auto-send drafts to external messaging or FHIR endpoints.
 */

export interface SubspecialistPromptVersion {
  readonly version: string
  readonly title: string
  readonly promptText: string
}

export const DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1: SubspecialistPromptVersion = {
  version: 'v1.0-subspecialist-id',
  title: 'Template Prompt Subspesialis AI-EMR Indonesia (§19 A–K)',
  promptText: [
    'Anda adalah dokter dengan kemampuan Subspesialis sesuai penyakit/masalah dari diagnosis kerja pasien.',
    'Sajikan dokumentasi terstruktur dalam Bahasa Indonesia medis profesional (Seksi A–K):',
    'A. Identitas Pasien & Episode.',
    'B. Subjective (S): Keluhan Utama, RPS metode SOCRATES, serta RPD, RPK, RPO, Alergi, Kehamilan/Persalinan, Tumbuh Kembang, Nutrisi, Imunisasi, Sosial-Ekonomi & Lingkungan — bila tidak tersedia tulis eksplisit "belum dikaji", DILARANG mengarang atau menganggap negatif.',
    'C. Objective (O): TTV lengkap dan Pemeriksaan Fisik 16 sistem terdokumentasi + daftar terpisah "Pemeriksaan tambahan yang direkomendasikan".',
    'D. Antropometri Deterministik: Dewasa gunakan IMT = BB/TB² & BSA Mosteller = √((TB×BB)/3600); BB/U, TB/U, BB/TB wajib "N/A (pasien dewasa)". Pediatrik (<18 th) gunakan Z-score WHO/CDC LMS.',
    'E. Penunjang: Lab, Radiologi, EKG, Histopatologi — DILARANG mengarang hasil EKG/PA bila belum dikerjakan.',
    'F. Assessment (A): Daftar masalah terprioritas klinis.',
    'G. Pengkajian Masalah: Awali tepat dengan "Dipikirkan ..." membandingkan diagnosis kerja vs diagnosis banding lintas sistem organ, etiopatofisiologi, faktor risiko, serta ketidakpastian klinis.',
    'H. Plan (P): Pisahkan tegas terapi yang sudah diberikan vs usulan draf AI (clinically_reviewed = false).',
    'I. Kalkulator Cairan & Nutrisi: Balance cairan, urine output (mL/kg/jam), & kecepatan infus (mL/jam).',
    'J. Edukasi Pasien: Diet terukur, tidur, aktivitas, tanda bahaya, dan kontrol.',
    'K. Referensi Terverifikasi: Hanya cantumkan pedoman yang relevan (FKUI IPD, Harrison, PPK, WHO/CDC) tanpa mengarang kutipan.',
  ].join('\n'),
}

export type CalcValueStatus = 'ok' | 'missing_input' | 'invalid_input' | 'N/A_ADULT'

export interface AdultAnthropometryResult {
  readonly status: 'ok' | 'missing_input' | 'invalid_input'
  readonly bmiKgM2: number | null
  readonly bmiCategoryAsiaPacific: string | null
  readonly bsaMostellerM2: number | null
  readonly pediatricIndices: {
    readonly status: 'N/A_ADULT' | 'pediatric_applicable' | 'unknown_age'
    readonly bbPerU: string
    readonly tbPerU: string
    readonly bbPerTb: string
  }
  readonly note: string
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function validPosNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

export function calculateAdultAnthropometry(
  weightKgRaw: number | string | null | undefined,
  heightCmRaw: number | string | null | undefined,
  ageYearsRaw: number | string | null | undefined,
): AdultAnthropometryResult {
  const weightKg = validPosNum(weightKgRaw)
  const heightCm = validPosNum(heightCmRaw)
  const ageYears = validPosNum(ageYearsRaw)

  if (weightKg === null || heightCm === null) {
    return {
      status: 'missing_input',
      bmiKgM2: null,
      bmiCategoryAsiaPacific: null,
      bsaMostellerM2: null,
      pediatricIndices: {
        status: ageYears !== null && ageYears >= 18 ? 'N/A_ADULT' : 'unknown_age',
        bbPerU: ageYears !== null && ageYears >= 18 ? 'N/A (pasien dewasa)' : 'belum dikaji',
        tbPerU: ageYears !== null && ageYears >= 18 ? 'N/A (pasien dewasa)' : 'belum dikaji',
        bbPerTb: ageYears !== null && ageYears >= 18 ? 'N/A (pasien dewasa)' : 'belum dikaji',
      },
      note: 'Berat badan atau tinggi badan belum lengkap.',
    }
  }
  if (weightKg <= 0 || heightCm <= 0 || (ageYears !== null && ageYears < 0)) {
    return {
      status: 'invalid_input',
      bmiKgM2: null,
      bmiCategoryAsiaPacific: null,
      bsaMostellerM2: null,
      pediatricIndices: {
        status: 'unknown_age',
        bbPerU: 'tidak valid',
        tbPerU: 'tidak valid',
        bbPerTb: 'tidak valid',
      },
      note: 'Nilai BB/TB/usia harus bernilai positif (> 0).',
    }
  }

  const heightM = heightCm / 100
  const bmi = round2(weightKg / (heightM * heightM))
  const bsa = round2(Math.sqrt((heightCm * weightKg) / 3600))
  const cat =
    bmi < 18.5
      ? 'Underweight (<18,5)'
      : bmi < 23
        ? 'Normoweight Asia-Pasifik (18,5–22,9)'
        : bmi < 25
          ? 'Overweight / Berisiko Asia-Pasifik (23,0–24,9)'
          : bmi < 30
            ? 'Obesitas I Asia-Pasifik (25,0–29,9)'
            : 'Obesitas II Asia-Pasifik (>=30,0)'

  const isAdult = ageYears !== null && ageYears >= 18
  return {
    status: 'ok',
    bmiKgM2: bmi,
    bmiCategoryAsiaPacific: cat,
    bsaMostellerM2: bsa,
    pediatricIndices: isAdult
      ? {
          status: 'N/A_ADULT',
          bbPerU: 'N/A (pasien dewasa >=18 tahun)',
          tbPerU: 'N/A (pasien dewasa >=18 tahun)',
          bbPerTb: 'N/A (pasien dewasa >=18 tahun)',
        }
      : {
          status: ageYears === null ? 'unknown_age' : 'pediatric_applicable',
          bbPerU: ageYears === null ? 'Usia belum diisi' : 'Gunakan kurva WHO/CDC LMS pediatrik',
          tbPerU: ageYears === null ? 'Usia belum diisi' : 'Gunakan kurva WHO/CDC LMS pediatrik',
          bbPerTb: ageYears === null ? 'Usia belum diisi' : 'Gunakan kurva WHO/CDC LMS pediatrik',
        },
    note: isAdult ? 'Perhitungan dewasa selesai; indeks pediatrik dikunci N/A.' : 'Perhitungan antropometri selesai.',
  }
}

export interface PediatricZScoreResult {
  readonly status: CalcValueStatus
  readonly zScore: number | null
  readonly classification: string
}

export function calculatePediatricLmsZScore(
  measurementRaw: number | string | null | undefined,
  L: number,
  M: number,
  S: number,
  ageYearsRaw: number | string | null | undefined,
): PediatricZScoreResult {
  const x = validPosNum(measurementRaw)
  const ageYears = validPosNum(ageYearsRaw)
  if (ageYears === null || x === null) {
    return { status: 'missing_input', zScore: null, classification: 'Input usia/ukuran belum lengkap' }
  }
  if (ageYears >= 18) {
    return { status: 'N/A_ADULT', zScore: null, classification: 'N/A (indeks Z-score LMS hanya untuk pediatrik <18 tahun)' }
  }
  if (x <= 0 || M <= 0 || S <= 0) {
    return { status: 'invalid_input', zScore: null, classification: 'Parameter LMS/pengukuran harus > 0' }
  }
  const z = L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S)
  const rounded = round2(z)
  const classification =
    rounded < -3
      ? 'Sangat kurang / Gizi buruk (Z < -3)'
      : rounded < -2
        ? 'Kurang / Wasted / Stunted (-3 <= Z < -2)'
        : rounded <= 2
          ? 'Normal (-2 <= Z <= +2)'
          : 'Di atas +2 SD (Overweight/Tinggi)'
  return { status: 'ok', zScore: rounded, classification }
}

export interface FluidAndInfusionResult {
  readonly status: 'ok' | 'missing_input'
  readonly fluidBalanceMl: number | null
  readonly urineOutputMlKgH: number | null
  readonly urineWarning: string | null
  readonly infusionRateMlPerH: number | null
  readonly dropsPerMin: number | null
}

export function calculateFluidAndInfusion(input: {
  readonly intakeMl?: number | string | null
  readonly outputMl?: number | string | null
  readonly weightKg?: number | string | null
  readonly durationHours?: number | string | null
  readonly targetVolumeMl?: number | string | null
  readonly dropFactor?: 20 | 60
}): FluidAndInfusionResult {
  const intake = validPosNum(input.intakeMl)
  const output = validPosNum(input.outputMl)
  const weight = validPosNum(input.weightKg)
  const hours = validPosNum(input.durationHours)
  const targetVol = validPosNum(input.targetVolumeMl)

  const fluidBalanceMl = intake !== null && output !== null ? round2(intake - output) : null
  const urineOutputMlKgH =
    output !== null && weight !== null && weight > 0 && hours !== null && hours > 0
      ? round2(output / (weight * hours))
      : null
  const urineWarning =
    urineOutputMlKgH !== null && urineOutputMlKgH < 0.5
      ? 'Oliguria (<0,5 mL/kg/jam) — evaluasi perfusi & status volume segera'
      : null
  const infusionRateMlPerH = targetVol !== null && hours !== null && hours > 0 ? round2(targetVol / hours) : null
  const dropsPerMin =
    infusionRateMlPerH !== null && input.dropFactor
      ? Math.round((infusionRateMlPerH * input.dropFactor) / 60)
      : null

  if (fluidBalanceMl === null && urineOutputMlKgH === null && infusionRateMlPerH === null) {
    return {
      status: 'missing_input',
      fluidBalanceMl: null,
      urineOutputMlKgH: null,
      urineWarning: null,
      infusionRateMlPerH: null,
      dropsPerMin: null,
    }
  }

  return {
    status: 'ok',
    fluidBalanceMl,
    urineOutputMlKgH,
    urineWarning,
    infusionRateMlPerH,
    dropsPerMin,
  }
}

// ── Quick Consult Auto-Formatter (Screenshot 4) ─────────────────────────────
export type QuickConsultTemplateId =
  | 'konsul_dpjp_general'
  | 'konsul_igd_emergensi'
  | 'sbar'
  | 'isbar'
  | 'cppt'
  | 'rujukan_eksternal'
  | 'handover_jaga'
  | 'resume_ringkas'

export type QuickConsultOutputFormat =
  | 'whatsapp_draft'
  | 'structured_emr'
  | 'soap'
  | 'sbar'
  | 'cppt'
  | 'fhir_composition_json'

export interface QuickConsultInput {
  readonly templateId: QuickConsultTemplateId
  readonly targetSpecialist: string
  readonly patientIdentity: string
  readonly chiefComplaintAndHistory: string
  readonly comorbiditiesAndThorax: string
  readonly vitalsAndPhysicalExam: string
  readonly workingAssessment: string
  readonly supportiveSummary: string
  readonly therapyGiven: string
  readonly planOrConsultGoal: string
  readonly senderIdentity: string
  readonly careUnit: string
}

export const QUICK_CONSULT_TEMPLATES: readonly { readonly id: QuickConsultTemplateId; readonly label: string }[] = [
  { id: 'konsul_dpjp_general', label: '1. Konsul General DPJP (IGD / Rawat Inap)' },
  { id: 'konsul_igd_emergensi', label: '2. Konsul IGD Emergensi Prioritas' },
  { id: 'sbar', label: '3. Format SBAR Terstruktur' },
  { id: 'isbar', label: '4. Format ISBAR Klinis' },
  { id: 'cppt', label: '5. CPPT Terintegrasi (SOAP)' },
  { id: 'rujukan_eksternal', label: '6. Pengantar Rujukan Eksternal' },
  { id: 'handover_jaga', label: '7. Handover Antar-Shift' },
  { id: 'resume_ringkas', label: '8. Resume Medis Ringkas' },
]

export const SYNTHETIC_QUICK_CONSULT_EXAMPLES: readonly { readonly id: string; readonly label: string; readonly data: QuickConsultInput }[] = [
  {
    id: 'ipd_synthetic',
    label: 'Contoh Kasus IPD (Ny. Yuliana · Sintetik)',
    data: {
      templateId: 'konsul_dpjp_general',
      targetSpecialist: 'dr. Ruddy, Sp.PD',
      patientIdentity: 'Ny. Yuliana (Sintetik) / 72 tahun / Perempuan',
      chiefComplaintAndHistory: 'Nyeri ulu hati & dada kiri sejak 3 jam SMRS, mual (+), riwayat DM (+) HT (+)',
      comorbiditiesAndThorax: 'Riwayat DM tipe 2, HT stage II; Foto toraks menunggu expertise',
      vitalsAndPhysicalExam: 'CM, TD 150/90 mmHg, N 88x/m, RR 20x/m, S 36,6°C, SpO2 98% RA, Cor/Pulmo dbn, NT epigastrium (+)',
      workingAssessment: 'Obs. Chest Pain ec Susp. ACS dd/ Dispepsia Akut + HT Stage II + DM Tipe 2',
      supportiveSummary: 'Troponin I & EKG 12-lead terorder; GDP/GDS 218 mg/dL',
      therapyGiven: 'IVFD RL 15 tpm, Pantoprazole 1x40mg IV, Ondansetron 1x8mg IV',
      planOrConsultGoal: 'Mohon advis rawat inap, tatalaksana lanjutan, & konfirmasi pemeriksaan lab/EKG serial',
      senderIdentity: 'Dokter Jaga IGD',
      careUnit: 'IGD',
    },
  },
  {
    id: 'bedah_synthetic',
    label: 'Contoh Kasus Bedah (An. Alzio · Sintetik)',
    data: {
      templateId: 'konsul_igd_emergensi',
      targetSpecialist: 'dr. Hanny, Sp.B',
      patientIdentity: 'An. Alzio (Sintetik) / 10 tahun / Laki-laki / BB 32 kg',
      chiefComplaintAndHistory: 'Nyeri perut kanan bawah sejak 12 jam SMRS, demam (+), muntah 2x',
      comorbiditiesAndThorax: 'Tidak ada komorbid berat tercatat; imunisasi dasar lengkap per orang tua',
      vitalsAndPhysicalExam: 'CM, TD 105/70 mmHg, N 112x/m, RR 22x/m, S 38,2°C, SpO2 99% RA, NT McBurney (+), Rovsing (+)',
      workingAssessment: 'Suspek Apendisitis Akut',
      supportiveSummary: 'Leukosit 16.400/µL; USG abdomen diusulkan',
      therapyGiven: 'IVFD RL maintenance sesuai BB, Paracetamol 450 mg IV bila demam, puasa sementara',
      planOrConsultGoal: 'Mohon konsul cito bedah untuk evaluasi operasi apendektomi & persiapan OK',
      senderIdentity: 'Dokter Jaga IGD',
      careUnit: 'IGD',
    },
  },
]

export function formatQuickConsultOutput(
  input: QuickConsultInput,
  format: QuickConsultOutputFormat,
  options?: { readonly redactDirectIdentifiers?: boolean },
): {
  readonly draftOnly: true
  readonly clinically_reviewed: false
  readonly autoSent: false
  readonly format: QuickConsultOutputFormat
  readonly text: string
} {
  const identity = options?.redactDirectIdentifiers
    ? input.patientIdentity.replace(/\b(?:Ny\.|Tn\.|An\.|Sdr\.)\s+[A-Za-z.\s()-]+(?=\/|$)/i, '[Pasien Teranonimisasi] ')
    : input.patientIdentity || '[Identitas pasien belum diisi]'
  const orNA = (v: string) => (v.trim() ? v.trim() : 'belum dikaji')

  if (format === 'fhir_composition_json') {
    const bundle = {
      resourceType: 'Composition',
      status: 'preliminary',
      title: `Draf Konsul Klinis (${input.templateId})`,
      section: [
        { title: 'Subjective', text: `${orNA(input.chiefComplaintAndHistory)} | Komorbid: ${orNA(input.comorbiditiesAndThorax)}` },
        { title: 'Objective', text: `${orNA(input.vitalsAndPhysicalExam)} | Penunjang: ${orNA(input.supportiveSummary)}` },
        { title: 'Assessment', text: orNA(input.workingAssessment) },
        { title: 'Plan', text: `Diberikan: ${orNA(input.therapyGiven)} | Usulan: ${orNA(input.planOrConsultGoal)}` },
      ],
      extension: [{ url: 'clinically_reviewed', valueBoolean: false }],
    }
    return { draftOnly: true, clinically_reviewed: false, autoSent: false, format, text: JSON.stringify(bundle, null, 2) }
  }

  const lines =
    format === 'sbar'
      ? [
          `[DRAF KONSUL SBAR · clinically_reviewed = false — JANGAN kirim otomatis tanpa tinjauan dokter]`,
          `Kepada: ${orNA(input.targetSpecialist)}`,
          `S (Situation): ${identity} di ${orNA(input.careUnit)} — Diagnosis/Assessment: ${orNA(input.workingAssessment)}`,
          `B (Background): ${orNA(input.chiefComplaintAndHistory)} | Komorbid: ${orNA(input.comorbiditiesAndThorax)}`,
          `A (Assessment): TTV & PF: ${orNA(input.vitalsAndPhysicalExam)} | Penunjang: ${orNA(input.supportiveSummary)}`,
          `R (Recommendation): Terapi berjalan: ${orNA(input.therapyGiven)} | Mohon advis: ${orNA(input.planOrConsultGoal)}`,
          `Pengirim: ${orNA(input.senderIdentity)}`,
        ]
      : format === 'soap' || format === 'cppt' || format === 'structured_emr'
        ? [
            `[DRAF ${format.toUpperCase()} · Template: ${input.templateId} · clinically_reviewed = false]`,
            `Pasien: ${identity} (${orNA(input.careUnit)})`,
            `S: ${orNA(input.chiefComplaintAndHistory)}. Komorbid/Riwayat: ${orNA(input.comorbiditiesAndThorax)}.`,
            `O: ${orNA(input.vitalsAndPhysicalExam)}. Penunjang: ${orNA(input.supportiveSummary)}.`,
            `A: ${orNA(input.workingAssessment)}.`,
            `P: Terapi berjalan: ${orNA(input.therapyGiven)}. Usulan/Konsul ke ${orNA(input.targetSpecialist)}: ${orNA(input.planOrConsultGoal)}.`,
          ]
        : [
            `Selamat siang/malam ${orNA(input.targetSpecialist)}, izin melaporkan pasien dari ${orNA(input.careUnit)}:`,
            ``,
            `Identitas: ${identity}`,
            `Assessment: ${orNA(input.workingAssessment)}`,
            `Anamnesis & Komorbid: ${orNA(input.chiefComplaintAndHistory)} | ${orNA(input.comorbiditiesAndThorax)}`,
            `PF & TTV: ${orNA(input.vitalsAndPhysicalExam)}`,
            `Penunjang: ${orNA(input.supportiveSummary)}`,
            `Terapi IGD/Saat Ini: ${orNA(input.therapyGiven)}`,
            `Rencana / Mohon Advis: ${orNA(input.planOrConsultGoal)}`,
            ``,
            `Hormat kami, ${orNA(input.senderIdentity)}`,
            `(Catatan: Draf klinis AI/Template — clinically_reviewed = false; verifikasi DPJP sebelum dikirim manual)`,
          ]

  return {
    draftOnly: true,
    clinically_reviewed: false,
    autoSent: false,
    format,
    text: lines.join('\n'),
  }
}

// ── Subspecialist Documentation Generator (§19–§20) ──────────────────────────
export interface SubspecialistCaseInput {
  readonly patientCode: string
  readonly ageYears: number | null
  readonly sex: 'Laki-laki' | 'Perempuan' | 'Tidak diketahui'
  readonly weightKg: number | null
  readonly heightCm: number | null
  readonly chiefComplaint: string
  readonly rps: string
  readonly rpd?: string
  readonly rpk?: string
  readonly medicationHistory?: string
  readonly allergies?: string
  readonly pregnancyDeliveryHistory?: string
  readonly growthDevHistory?: string
  readonly nutritionHistory?: string
  readonly immunizationHistory?: string
  readonly socioeconomicEnvironment?: string
  readonly vitals: {
    readonly td?: string
    readonly hrBpm?: number | null
    readonly rr?: number | null
    readonly tempC?: number | null
    readonly spo2Pct?: number | null
  }
  readonly documentedExamFindings: string
  readonly imagingSummary?: string
  readonly labResults?: readonly { readonly name: string; readonly value: string; readonly abnormal?: boolean }[]
  readonly ekgPerformed?: boolean
  readonly histopathologyConfirmed?: boolean
  readonly administeredTherapies?: readonly string[]
  readonly plannedProcedure?: string
}

export interface SubspecialistDocDraft {
  readonly draftOnly: true
  readonly clinically_reviewed: false
  readonly promptVersion: string
  readonly anthropometry: AdultAnthropometryResult
  readonly clinicalAlerts: readonly string[]
  readonly missingItemsMarkedBelumDikaji: readonly string[]
  readonly assessmentHeading: string
  readonly pengkajianMasalah: string
  readonly therapiesAdministered: readonly string[]
  readonly aiDraftPlanProposals: readonly string[]
  readonly sectionsText: string
}

export function generateSubspecialistClinicalDraft(
  c: SubspecialistCaseInput,
  prompt: SubspecialistPromptVersion = DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1,
): SubspecialistDocDraft {
  const anthro = calculateAdultAnthropometry(c.weightKg, c.heightCm, c.ageYears)
  const missingFields: string[] = []
  const mark = (label: string, val?: string): string => {
    if (val && val.trim()) return val.trim()
    missingFields.push(label)
    return 'belum dikaji'
  }

  const rpd = mark('RPD', c.rpd)
  const rpk = mark('RPK', c.rpk)
  const rpo = mark('RPO', c.medicationHistory)
  const alergi = mark('Alergi', c.allergies)
  const kehamilan = mark('Kehamilan/Persalinan', c.pregnancyDeliveryHistory)
  const tumbuh = mark('Tumbuh Kembang', c.growthDevHistory)
  const nutrisi = mark('Nutrisi', c.nutritionHistory)
  const imunisasi = mark('Imunisasi', c.immunizationHistory)
  const sosek = mark('Sosial-Ekonomi & Lingkungan', c.socioeconomicEnvironment)

  const alerts: string[] = []
  const hr = c.vitals.hrBpm ?? null
  if (hr !== null && hr >= 100) {
    alerts.push(
      hr >= 130
        ? `TAKIKARDIA BERAT (Nadi ${hr}x/menit) — evaluasi penyebab (nyeri, demam, hipovolemia, infeksi, kecemasan, atau aritmia) dan segera lakukan EKG 12-lead.`
        : `Takikardia (Nadi ${hr}x/menit).`,
    )
  }
  const sgotLab = c.labResults?.find((l) => /sgot|ast/i.test(l.name))
  const sgptLab = c.labResults?.find((l) => /sgpt|alt/i.test(l.name))
  if (sgotLab?.abnormal || sgptLab?.abnormal) {
    alerts.push(
      `Peningkatan transaminase hati (${[sgotLab ? `${sgotLab.name} ${sgotLab.value}` : '', sgptLab ? `${sgptLab.name} ${sgptLab.value}` : ''].filter(Boolean).join(', ')}) — evaluasi etiologi hepatik/obat/infeksi dan sesuaikan obat hepatotoksik sebelum tindakan.`,
    )
  }
  if (!c.ekgPerformed) {
    alerts.push('EKG belum dilakukan / belum terdokumentasi — DILARANG menyimpulkan irama jantung normal tanpa rekaman.')
  }
  if (c.histopathologyConfirmed !== true) {
    alerts.push('Konfirmasi histopatologi/PA belum tersedia — keganasan tetap bersifat dugaan klinis/radiologis hingga PA definitif keluar.')
  }

  const assessmentHeading = c.histopathologyConfirmed
    ? 'Neoplasma ganas terkonfirmasi histopatologi dengan penyulit sistemik terpantau'
    : 'Suspek massa / lesi ekspansif dengan potensi komplikasi lokal & evaluasi kelayakan pra-tindakan (menunggu konfirmasi PA)'

  const pengkajianMasalah = [
    `Dipikirkan masalah utama berupa proses ekspansif/desak ruang lokal yang berpotensi menginvasi struktur berdekatan${c.imagingSummary ? ` (${c.imagingSummary})` : ''}, dengan diagnosis kerja sementara masih bersifat dugaan klinis karena konfirmasi histopatologi definitif belum tersedia.`,
    `Diagnosis banding lintas sistem mencakup proses neoplasma ganas vs jinak agresif, inflamasi/infeksi granulomatosa kronik, maupun kelainan vaskular/struktural.`,
    hr !== null && hr >= 100
      ? `Secara sistemik ditemukan takikardia (${hr}x/menit) yang belum tersingkirkan penyebab kardiovaskular maupun non-kardiovaskularnya karena pemeriksaan EKG belum terdokumentasi.`
      : 'Evaluasi TTV dan penunjang harus diselaraskan sebelum tindakan invasif.',
  ].join(' ')

  const aiDraftPlanProposals = [
    ...(!c.ekgPerformed ? ['Usulan Penunjang (Draft AI): Lakukan EKG 12-lead segera untuk evaluasi takikardia & kelaikan pra-operasi.'] : []),
    ...(c.histopathologyConfirmed !== true ? ['Usulan Diagnostik (Draft AI): Konfirmasi histopatologi/PA jaringan untuk menegakkan diagnosis definitif & staging.'] : []),
    ...(sgotLab?.abnormal || sgptLab?.abnormal
      ? ['Usulan Medis (Draft AI): Evaluasi penyebab peningkatan SGOT/SGPT serta hindari/sesuaikan dosis obat yang dimetabolisme hepar.']
      : []),
    ...(c.plannedProcedure
      ? [`Usulan Pra-Tindakan (Draft AI): Pastikan persetujuan tindakan, kelaikan anestesi/kardiologi, dan kesiapan kamar operasi untuk rencana ${c.plannedProcedure}.`]
      : []),
  ]

  const administered = c.administeredTherapies?.length ? c.administeredTherapies : ['Belum ada terapi berjalan yang terinput dalam sesi ini.']
  const fullText = [
    `=== DRAF DOKUMENTASI SUBSPESIALIS AI-EMR (${prompt.version}) · clinically_reviewed = false ===`,
    `A. Identitas: ${c.patientCode} | Usia: ${c.ageYears ?? 'belum dikaji'} th | JK: ${c.sex}`,
    `B. Subjective (S):`,
    `- Keluhan Utama: ${c.chiefComplaint || 'belum dikaji'}`,
    `- RPS (SOCRATES): ${c.rps || 'belum dikaji'}`,
    `- RPD: ${rpd} | RPK: ${rpk} | RPO: ${rpo} | Alergi: ${alergi}`,
    `- Kehamilan/Persalinan: ${kehamilan} | Tumbuh Kembang: ${tumbuh} | Nutrisi: ${nutrisi} | Imunisasi: ${imunisasi} | Sosek/Lingkungan: ${sosek}`,
    `C. Objective (O): TD ${c.vitals.td ?? 'belum dikaji'}, N ${hr ?? 'belum dikaji'}x/m, RR ${c.vitals.rr ?? 'belum dikaji'}x/m, S ${c.vitals.tempC ?? 'belum dikaji'}°C, SpO2 ${c.vitals.spo2Pct ?? 'belum dikaji'}% | PF: ${c.documentedExamFindings || 'belum dikaji'}`,
    `D. Antropometri: IMT ${anthro.bmiKgM2 ?? 'N/A'} kg/m² (${anthro.bmiCategoryAsiaPacific ?? '-'}), BSA Mosteller ${anthro.bsaMostellerM2 ?? 'N/A'} m² | BB/U: ${anthro.pediatricIndices.bbPerU} | TB/U: ${anthro.pediatricIndices.tbPerU} | BB/TB: ${anthro.pediatricIndices.bbPerTb}`,
    `E. Penunjang: Lab: ${(c.labResults ?? []).map((l) => `${l.name} ${l.value}`).join('; ') || 'belum ada'} | Imaging: ${c.imagingSummary || 'belum ada'} | EKG: ${c.ekgPerformed ? 'Ada' : 'EKG belum dilakukan / belum terdokumentasi'} | PA: ${c.histopathologyConfirmed ? 'Terkonfirmasi' : 'Belum tersedia'}`,
    `F. Assessment: ${assessmentHeading}`,
    `G. Pengkajian Masalah: ${pengkajianMasalah}`,
    `H. Plan — Terapi Sudah Diberikan: ${administered.join('; ')} || Usulan Draft AI: ${aiDraftPlanProposals.join('; ')}`,
    `J. Edukasi Pasien: Penjelasan kondisi & ketidakpastian diagnostik menunggu PA/penunjang, tanda bahaya (sesak, berdebar hebat, perdarahan, nyeri tak tertahankan, penurunan kesadaran), pola istirahat, nutrisi seimbang, dan jadwal kontrol.`,
    `K. Referensi: Buku Ajar Ilmu Penyakit Dalam FKUI; Harrison's Principles of Internal Medicine; PPK Nasional / Kemenkes RI.`,
  ].join('\n')

  return {
    draftOnly: true,
    clinically_reviewed: false,
    promptVersion: prompt.version,
    anthropometry: anthro,
    clinicalAlerts: alerts,
    missingItemsMarkedBelumDikaji: missingFields,
    assessmentHeading,
    pengkajianMasalah,
    therapiesAdministered: administered,
    aiDraftPlanProposals,
    sectionsText: fullText,
  }
}
