import { SYSTEM_PROMPT, EMR_DRAFT_INSTRUCTION } from './systemPrompt'
import type { ChatMessage, Patient, VitalSign, SupportiveResult } from './types'

const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export interface AISettings {
  apiKey: string
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

function contextBlock(ctx: PatientContext): string {
  const { patient: p, latestVitals: v, supportive } = ctx
  const lines = [
    `KONTEKS PASIEN (continuous identity):`,
    `- Nama: ${p.name} | ${p.sex === 'L' ? 'Laki-laki' : 'Perempuan'} | Usia ${ageFromDob(p.dob)} th | MRN ${p.mrn}`,
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

export function hasKey(settings: AISettings): boolean {
  return Boolean(settings.apiKey && settings.apiKey.trim().length > 10)
}

async function callClaude(
  settings: AISettings,
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemExtra = '',
): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT + (systemExtra ? `\n\n${systemExtra}` : ''),
      messages,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Claude API ${res.status}: ${txt.slice(0, 300)}`)
  }
  const data = await res.json()
  const block = (data.content || []).find((b: { type: string }) => b.type === 'text')
  return block?.text ?? '(tidak ada respons)'
}

export async function sendChat(
  settings: AISettings,
  history: ChatMessage[],
  ctx: PatientContext,
): Promise<string> {
  const msgs = history.map((m) => ({ role: m.role, content: m.content }))
  // Front-load the continuous patient context on the first user turn.
  const sysExtra = contextBlock(ctx)
  if (!hasKey(settings)) {
    return demoChatReply(history, ctx)
  }
  return callClaude(settings, msgs, sysExtra)
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
  problems: { title: string; basis: string; assessment: string }[]
  draftPlan: { category: string; text: string }[]
  references: string[]
}

export async function draftEMR(
  settings: AISettings,
  history: ChatMessage[],
  ctx: PatientContext,
): Promise<EMRDraft> {
  if (!hasKey(settings)) {
    return demoDraft(ctx)
  }
  const transcript = history
    .map((m) => `${m.role === 'user' ? 'Pasien' : 'AI'}: ${m.content}`)
    .join('\n')
  const msgs = [
    {
      role: 'user' as const,
      content: `${contextBlock(ctx)}\n\nTRANSKRIP ANAMNESIS:\n${transcript}\n\n${EMR_DRAFT_INSTRUCTION}`,
    },
  ]
  const raw = await callClaude(settings, msgs)
  const json = extractJson(raw)
  return json as EMRDraft
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
    `MODE: Clinical — Education/Simulation\n\n⚠️ MODE DEMO (tanpa API key). Tambahkan API key Anthropic di **Pengaturan** untuk respons AI sungguhan.\n\nHalo ${name}, saya asisten klinis–longevity Anda — mendukung, bukan menggantikan, dokter pemeriksa. Boleh ceritakan **keluhan utama** Anda hari ini? Sejak kapan dirasakan?`,
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
        basis:
          'Anamnesis nyeri kepala oksipital + tengkuk kaku; riwayat hipertensi dengan kepatuhan rendah; vital TD meningkat.',
        assessment:
          'Dipikirkan hipertensi esensial tidak terkontrol sebagai penyebab utama, mengingat pola nyeri kepala oksipital pagi hari, riwayat keluarga, dan kepatuhan obat yang rendah, lebih daripada nyeri kepala tipe tegang primer — meski keduanya dapat tumpang tindih. Patofisiologi: peningkatan resistensi vaskular perifer dan remodeling arteriolar meningkatkan afterload; perlu disingkirkan penyebab sekunder (renoparenkimal, renovaskular, endokrin) melalui penunjang.',
      },
    ],
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
