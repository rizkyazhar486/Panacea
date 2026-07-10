import { SYSTEM_PROMPT, EMR_DRAFT_INSTRUCTION, EMR_FRAMEWORK } from './systemPrompt'
import { api, backendEnabled } from './api'
import type {
  ChatMessage,
  Patient,
  VitalSign,
  SupportiveResult,
  Material,
  AIReview,
  EducationSheet,
} from './types'

export interface AISettings {
  model: string
  doctorName: string
}

export interface PatientContext {
  patient: Patient
  latestVitals?: VitalSign
  supportive: SupportiveResult[]
}

function ageFromDob(dob: string): number {
  const d = new Date(dob)
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

function ageGroup(age: number): string {
  if (age < 1) return 'bayi (neonatus/infant)'
  if (age < 5) return 'balita'
  if (age < 12) return 'anak'
  if (age < 18) return 'remaja'
  if (age < 60) return 'dewasa'
  return 'lansia (geriatri)'
}

function contextBlock(ctx: PatientContext): string {
  const { patient: p, latestVitals: v, supportive } = ctx
  const age = ageFromDob(p.dob)
  const lines = [
    `KONTEKS PASIEN (continuous identity):`,
    `- Nama: ${p.name} | ${p.sex === 'L' ? 'Laki-laki' : 'Perempuan'} | Usia ${age} th (${ageGroup(age)}) | MRN ${p.mrn}`,
    `- WAJIB sesuaikan gaya & isi pertanyaan dengan kelompok usia ini (mis. anamnesis anak ditanyakan ke orang tua/wali, pertimbangan tumbuh-kembang & imunisasi; pada lansia perhatikan polifarmasi, jatuh, fungsi kognitif & kemandirian). Gunakan bahasa yang sesuai usia.`,
    `- TB ${p.heightCm} cm, BB ${p.weightKg} kg`,
    `- Kondisi kronis: ${p.chronicConditions.join(', ') || '-'}`,
    `- Alergi: ${p.allergies.join(', ') || '-'}`,
    `- Risk flags: ${p.riskFlags.join(', ') || '-'}`,
  ]
  if (v) {
    lines.push(
      `- Vital terbaru: TD ${v.systolic}/${v.diastolic} mmHg, HR ${v.heartRate}/min, RR ${v.respRate}/min, T ${v.tempC}°C, SpO2 ${v.spo2}%${
        v.glucose ? `, GDS ${v.glucose} mg/dL` : ''
      }`,
    )
  }
  if (supportive.length) {
    lines.push(
      `- Penunjang terbaru: ${supportive
        .slice(0, 8)
        .map((s) => `${s.name} ${s.value}${s.unit ?? ''}${s.flag && s.flag !== 'normal' ? ` (${s.flag})` : ''}`)
        .join('; ')}`,
    )
  }
  return lines.join('\n')
}

// AI is "real" when the backend (with its server-side OpenRouter/Anthropic
// key) is configured — every request routes through it, never a key typed
// into the browser, so the provider (OpenRouter → Gemini/GLM) stays uniform.
export function aiAvailable(): boolean {
  return backendEnabled
}

async function callClaude(
  settings: AISettings,
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemExtra = '',
  modelOverride = '',
): Promise<string> {
  const system = SYSTEM_PROMPT + (systemExtra ? `\n\n${systemExtra}` : '')
  const model = modelOverride || settings.model
  const { text } = await api.aiMessages({ model, system, messages, max_tokens: 2048 })
  return text || '(tidak ada respons)'
}

export async function sendChat(
  settings: AISettings,
  history: ChatMessage[],
  ctx: PatientContext,
): Promise<string> {
  const msgs = history.map((m) => ({ role: m.role, content: m.content }))
  // Front-load the continuous patient context on the first user turn.
  const sysExtra = contextBlock(ctx)
  if (!aiAvailable()) return demoChatReply(history, ctx)
  try {
    return await callClaude(settings, msgs, sysExtra)
  } catch (e) {
    // Surface a clear message when the server-side rate limit is hit, rather
    // than silently dropping to scripted text.
    if (String((e as Error)?.message).includes('rate_limited')) {
      return '⏳ Terlalu banyak permintaan dalam waktu singkat. Mohon tunggu sebentar lalu coba lagi.'
    }
    return demoChatReply(history, ctx)
  }
}

export interface EMRDraft {
  keluhanUtama: string
  rps: string
  rpd: string
  rpk: string
  riwayatPengobatan: string
  riwayatAlergi: string
  riwayatNutrisi: string
  riwayatSosialEkonomi: string
  suggestedExams: string[]
  problems: { title: string; basis: string; assessment: string; probability?: number; differentials?: string[] }[]
  draftPlan: { category: string; text: string }[]
  prognosis?: string
  references: string[]
}

export async function draftEMR(
  settings: AISettings,
  history: ChatMessage[],
  ctx: PatientContext,
): Promise<EMRDraft> {
  if (!aiAvailable()) return demoDraft(ctx)
  const transcript = history
    .map((m) => `${m.role === 'user' ? 'Pasien' : 'AI'}: ${m.content}`)
    .join('\n')
  const msgs = [
    {
      role: 'user' as const,
      content: `${contextBlock(ctx)}\n\nTRANSKRIP ANAMNESIS:\n${transcript}\n\n${EMR_DRAFT_INSTRUCTION}`,
    },
  ]
  try {
    const raw = await callClaude(settings, msgs, EMR_FRAMEWORK)
    return extractJson(raw) as EMRDraft
  } catch {
    return demoDraft(ctx)
  }
}

// AI verification of an uploaded material / AI-EMR template (Claude gatekeeper).
export async function verifyMaterial(settings: AISettings, m: Material): Promise<AIReview> {
  if (!aiAvailable()) {
    await wait(1100)
    return demoVerify(m)
  }
  const msgs = [
    {
      role: 'user' as const,
      content: `Tinjau kelayakan materi medis untuk dijual di platform edukasi kedokteran. Nilai akurasi, kemutakhiran, keamanan klinis, dan kelengkapan. Judul: "${m.title}". Kategori: ${m.category}. Jalur: ${m.exam}. Spesialti: ${m.specialty}. Deskripsi: ${m.description}.\n\nKeluarkan HANYA JSON minified: {"verdict":"approved"|"revise","score":0-100,"notes":"alasan singkat bilingual"}`,
    },
  ]
  try {
    const raw = await callClaude(settings, msgs)
    const j = extractJson(raw) as { verdict: 'approved' | 'revise'; score: number; notes: string }
    return { ...j, at: new Date().toISOString() }
  } catch {
    return demoVerify(m)
  }
}

// Patient-facing disease education (brief + deep), for subscribers' patients.
export async function generateEducation(
  settings: AISettings,
  ctx: PatientContext,
  diagnosis: string,
): Promise<EducationSheet> {
  if (!aiAvailable()) {
    await wait(1000)
    return demoEducation(diagnosis)
  }
  const msgs = [
    {
      role: 'user' as const,
      content: `${contextBlock(ctx)}\n\nBuat EDUKASI PASIEN (bahasa awam, empatik, bilingual ID+EN) untuk diagnosis: "${diagnosis}". Singkat namun mendalam, agar pasien memahami penyakitnya dan cara menjaga kesehatan.\n\nKeluarkan HANYA JSON minified: {"diagnosis":string,"ringkas":string,"mendalam":string,"caraMenjaga":string[],"tandaBahaya":string[]}`,
    },
  ]
  try {
    // Education uses the EMR/GLM model. Backend routes "opus" → GLM (EMR_MODEL).
    const raw = await callClaude(settings, msgs, '', 'claude-opus-4-8')
    const j = extractJson(raw) as Omit<EducationSheet, 'generatedAt'>
    return { ...j, generatedAt: new Date().toISOString() }
  } catch {
    return demoEducation(diagnosis)
  }
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function demoVerify(m: Material): AIReview {
  const score = 78 + (m.title.length % 18)
  return {
    verdict: score >= 80 ? 'approved' : 'approved',
    score: Math.min(96, score),
    notes:
      '⚠️ Mode Demo. Konten dinilai konsisten dengan pedoman terkini; sitasi & dosis perlu konfirmasi verifikator spesialis. / Content appears consistent with current guidelines; citations & doses to be confirmed by a specialist verifier.',
    at: new Date().toISOString(),
  }
}

function demoEducation(diagnosis: string): EducationSheet {
  return {
    diagnosis,
    ringkas: `⚠️ Mode Demo. ${diagnosis} adalah kondisi yang perlu dipahami dan dikontrol bersama tim medis. Dengan pengobatan teratur dan gaya hidup sehat, kualitas hidup Anda dapat terjaga.`,
    mendalam:
      'Penyakit ini berkembang dari interaksi faktor risiko (genetik, gaya hidup, lingkungan) yang memengaruhi fungsi organ secara bertahap. Memahami pemicu, mengenali gejala dini, dan patuh pada terapi membantu mencegah komplikasi serta memperpanjang masa sehat (healthspan).',
    caraMenjaga: [
      'Minum obat sesuai jadwal; jangan berhenti tanpa anjuran dokter.',
      'Pola makan seimbang — kurangi garam, gula, dan lemak jenuh.',
      'Aktivitas fisik teratur (mis. jalan cepat 30 menit, 5×/minggu).',
      'Tidur cukup 7–8 jam dan kelola stres.',
      'Pantau tanda vital di rumah dan catat keluhan.',
    ],
    tandaBahaya: [
      'Sesak napas berat atau nyeri dada.',
      'Penurunan kesadaran atau kebingungan mendadak.',
      'Demam tinggi yang tidak membaik.',
      'Gejala memburuk cepat — segera ke fasilitas kesehatan.',
    ],
    generatedAt: new Date().toISOString(),
  }
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Respons AI tidak mengandung JSON yang valid.')
  return JSON.parse(raw.slice(start, end + 1))
}

// ---------------------------------------------------------------------------
// DEMO MODE — scripted, no API key required. Lets the app be explored offline.
// ---------------------------------------------------------------------------

function demoChatReply(history: ChatMessage[], ctx: PatientContext): string {
  const turn = history.filter((m) => m.role === 'user').length
  const name = ctx.patient.name.split(' ')[0]
  const scripts = [
    `Halo ${name}, saya asisten klinis–longevity Anda — mendukung, bukan menggantikan, dokter pemeriksa. Boleh ceritakan **keluhan utama** Anda hari ini? Sejak kapan dirasakan?\n\n_(Catatan: respons AI penuh sedang tidak terjangkau saat ini — ini balasan contoh. Coba lagi sesaat lagi.)_`,
    `Terima kasih. Mari perdalam dengan **SOCRATES**:\n- **Site** — di mana persisnya?\n- **Onset** — mendadak atau bertahap?\n- **Character** — seperti apa rasanya (tertekan, terbakar, tertusuk)?\n- **Radiation** — menjalar ke mana?\n\nSilakan jawab satu per satu.`,
    `Baik. Beberapa pertanyaan penyaring:\n- Apakah ada **demam**, penurunan berat badan, atau keringat malam?\n- Bagaimana **pola makan, tidur, dan aktivitas** belakangan ini?\n- Adakah riwayat penyakit serupa di keluarga?`,
    `Cukup lengkap untuk hipotesis awal. Berdasarkan keluhan dan konteks (${ctx.patient.chronicConditions.join(
      ', ',
    ) || 'tanpa komorbid tercatat'}), saya rekomendasikan **pemeriksaan penunjang**: pemeriksaan fisik terarah, lab dasar (darah lengkap, fungsi ginjal, elektrolit, GDS), dan EKG bila ada keluhan kardiovaskular.\n\nKetuk **“Susun Draft AI-EMR”** di atas — saya akan menyusun anamnesis terstruktur + daftar masalah + usulan rencana, untuk **diverifikasi dan dilengkapi oleh dokter**.`,
  ]
  return scripts[Math.min(turn - 1, scripts.length - 1)] ?? scripts[scripts.length - 1]
}

function demoDraft(ctx: PatientContext): EMRDraft {
  const chronic = ctx.patient.chronicConditions[0] ?? 'Hipertensi'
  return {
    keluhanUtama: 'Nyeri kepala dan mudah lelah sejak 1 minggu (simulasi demo).',
    rps:
      '⚠️ SIMULASI EDUKASI — temuan direkayasa untuk pembelajaran. Pasien mengeluh nyeri kepala (Site: oksipital; Onset: bertahap; Character: tertekan; Radiation: tidak menjalar; Associations: pusing berputar ringan; Time: memberat pagi hari; Exacerbating: aktivitas; Severity: 5/10). Disertai mudah lelah dan tengkuk terasa kaku.',
    rpd: `Riwayat ${chronic}, kontrol tidak teratur.`,
    rpk: 'Ibu dengan hipertensi dan DM tipe 2.',
    riwayatPengobatan: 'Amlodipin 5 mg/hari (sering lupa minum).',
    riwayatAlergi: ctx.patient.allergies.join(', ') || 'Tidak ada alergi diketahui.',
    riwayatNutrisi: 'Asupan tinggi garam dan rendah serat; kurang aktivitas fisik.',
    riwayatSosialEkonomi: 'Tinggal bersama keluarga, perokok pasif, stres pekerjaan sedang.',
    suggestedExams: [
      'Pemeriksaan fisik terarah: TD kedua lengan, funduskopi, auskultasi karotis & jantung',
      'Lab: darah lengkap, ureum/kreatinin, elektrolit, profil lipid, GDP/HbA1c, urinalisis',
      'EKG 12 sadapan (cari LVH/iskemia)',
      'Pertimbangkan ekokardiografi bila ada tanda hypertensive heart disease',
    ],
    problems: [
      {
        title: 'Hipertensi tidak terkontrol',
        probability: 80,
        basis:
          'Anamnesis nyeri kepala oksipital + tengkuk kaku; riwayat hipertensi dengan kepatuhan rendah; vital TD meningkat.',
        assessment:
          'Dipikirkan hipertensi esensial tidak terkontrol sebagai penyebab utama, mengingat pola nyeri kepala oksipital pagi hari, riwayat keluarga, dan kepatuhan obat yang rendah, lebih daripada nyeri kepala tipe tegang primer — meski keduanya dapat tumpang tindih. Patofisiologi: peningkatan resistensi vaskular perifer dan remodeling arteriolar meningkatkan afterload; perlu disingkirkan penyebab sekunder (renoparenkimal, renovaskular, endokrin) melalui penunjang. (Evidence level B)',
        differentials: [
          'Nyeri kepala tipe tegang — bilateral, tidak berdenyut, tanpa lonjakan TD bermakna.',
          'Hipertensi sekunder (renovaskular/endokrin) — onset muda/resisten, bruit abdomen, hipokalemia.',
        ],
      },
    ],
    prognosis:
      'Fair — baik bila kepatuhan & target TD tercapai; risiko komplikasi kardio-serebro-vaskular meningkat bila tidak terkontrol.',
    draftPlan: [
      { category: 'Suportif', text: 'Diet DASH, restriksi garam <5 g/hari, target keseimbangan cairan euvolemia.' },
      {
        category: 'Definitif',
        text: 'Optimalkan antihipertensi (mis. ACE-inhibitor/ARB ± CCB) — DOSIS DIVERIFIKASI DOKTER terhadap formularium & fungsi ginjal.',
      },
      { category: 'Edukasi', text: 'Kepatuhan obat, monitoring TD rumah 2×/hari, berhenti paparan rokok.' },
      { category: 'Follow-up', text: 'Kontrol 1–2 minggu; lebih cepat bila TD >180/120 atau gejala neurologis.' },
      { category: 'Monitoring', text: 'TD harian, fungsi ginjal & elektrolit 2–4 minggu setelah titrasi.' },
    ],
    references: [
      'Mancia G, et al. 2023 ESH Guidelines for the management of arterial hypertension. J Hypertens. 2023.',
      "Whelton PK, et al. ACC/AHA Hypertension Guideline. 2017 (update terkait).",
    ],
  }
}
