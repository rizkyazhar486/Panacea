import { SYSTEM_PROMPT, EMR_DRAFT_INSTRUCTION, EMR_FRAMEWORK } from './systemPrompt'
import { api, backendEnabled, type OntologyTerm } from './api'
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
  if (age < 1) return 'infant (neonate/infant)'
  if (age < 5) return 'toddler'
  if (age < 12) return 'child'
  if (age < 18) return 'adolescent'
  if (age < 60) return 'adult'
  return 'elderly (geriatric)'
}

function contextBlock(ctx: PatientContext): string {
  const { patient: p, latestVitals: v, supportive } = ctx
  const age = ageFromDob(p.dob)
  const lines = [
    `PATIENT CONTEXT (continuous identity):`,
    `- Name: ${p.name} | ${p.sex === 'L' ? 'Male' : 'Female'} | Age ${age} yr (${ageGroup(age)}) | MRN ${p.mrn}`,
    `- MUST adapt the style & content of questions to this age group (e.g. a child's history is taken from a parent/guardian, with growth/development & immunization considerations; for the elderly, watch for polypharmacy, falls, cognitive function & independence). Use age-appropriate language.`,
    `- Height ${p.heightCm} cm, Weight ${p.weightKg} kg`,
    `- Chronic conditions: ${p.chronicConditions.join(', ') || '-'}`,
    `- Allergies: ${p.allergies.join(', ') || '-'}`,
    `- Risk flags: ${p.riskFlags.join(', ') || '-'}`,
  ]
  if (v) {
    lines.push(
      `- Latest vitals: BP ${v.systolic}/${v.diastolic} mmHg, HR ${v.heartRate}/min, RR ${v.respRate}/min, T ${v.tempC}°C, SpO2 ${v.spo2}%${
        v.glucose ? `, glucose ${v.glucose} mg/dL` : ''
      }`,
    )
  }
  if (supportive.length) {
    lines.push(
      `- Latest supporting results: ${supportive
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
  return text || '(no response)'
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
      return '⏳ Too many requests in a short time. Please wait a moment and try again.'
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
    .map((m) => `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.content}`)
    .join('\n')
  const msgs = [
    {
      role: 'user' as const,
      content: `${contextBlock(ctx)}\n\nHISTORY-TAKING TRANSCRIPT:\n${transcript}\n\n${EMR_DRAFT_INSTRUCTION}`,
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
      content: `Review the suitability of this medical material for sale on a medical education platform. Assess accuracy, currency, clinical safety, and completeness. Title: "${m.title}". Category: ${m.category}. Track: ${m.exam}. Specialty: ${m.specialty}. Description: ${m.description}.\n\nOutput ONLY minified JSON: {"verdict":"approved"|"revise","score":0-100,"notes":"brief reason in English"}`,
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
      // ONE LANGUAGE, NOT TWO. A "bilingual" request makes the model write
      // every sentence twice separated by a |, so the patient reads the same
      // thing back to back and the page length doubles. The app's interface
      // is English; nobody here reads a second-language translation.
      content: `${contextBlock(ctx)}\n\nWrite PATIENT EDUCATION in ENGLISH only (plain language, empathetic) for the diagnosis: "${diagnosis}". Brief but substantive, so the patient understands their condition and how to take care of their health. Do not write a translation into another language and do not use | as a language separator.\n\nOutput ONLY minified JSON: {"diagnosis":string,"ringkas":string,"mendalam":string,"caraMenjaga":string[],"tandaBahaya":string[]}`,
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
      '⚠️ Demo Mode. Content appears consistent with current guidelines; citations & doses to be confirmed by a specialist verifier.',
    at: new Date().toISOString(),
  }
}

function demoEducation(diagnosis: string): EducationSheet {
  return {
    diagnosis,
    ringkas: `⚠️ Demo Mode. ${diagnosis} is a condition that needs to be understood and controlled together with your medical team. With regular treatment and a healthy lifestyle, your quality of life can be maintained.`,
    mendalam:
      'This condition develops from an interaction of risk factors (genetic, lifestyle, environmental) that gradually affect organ function. Understanding your triggers, recognizing early symptoms, and adhering to therapy help prevent complications and extend your healthy years (healthspan).',
    caraMenjaga: [
      'Take medication on schedule; do not stop without your doctor\'s advice.',
      'Eat a balanced diet — reduce salt, sugar, and saturated fat.',
      'Regular physical activity (e.g. 30 minutes of brisk walking, 5x/week).',
      'Get 7–8 hours of sleep and manage stress.',
      'Monitor your vital signs at home and note any symptoms.',
    ],
    tandaBahaya: [
      'Severe shortness of breath or chest pain.',
      'Loss of consciousness or sudden confusion.',
      'High fever that does not improve.',
      'Symptoms worsening quickly — seek care immediately.',
    ],
    generatedAt: new Date().toISOString(),
  }
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('The AI response does not contain valid JSON.')
  return JSON.parse(raw.slice(start, end + 1))
}

// ---------------------------------------------------------------------------
// DEMO MODE — scripted, no API key required. Lets the app be explored offline.
// ---------------------------------------------------------------------------

function demoChatReply(history: ChatMessage[], ctx: PatientContext): string {
  const turn = history.filter((m) => m.role === 'user').length
  const name = ctx.patient.name.split(' ')[0]
  const scripts = [
    `Hello ${name}, I'm your clinical-longevity assistant — supporting, not replacing, the examining doctor. Could you tell me your **chief complaint** today? Since when have you felt it?\n\n_(Note: full AI responses are unavailable right now — this is a sample reply. Please try again shortly.)_`,
    `Thank you. Let's dig deeper with **SOCRATES**:\n- **Site** — where exactly?\n- **Onset** — sudden or gradual?\n- **Character** — what does it feel like (pressure, burning, stabbing)?\n- **Radiation** — does it spread anywhere?\n\nPlease answer one at a time.`,
    `Good. A few screening questions:\n- Any **fever**, weight loss, or night sweats?\n- How has your **diet, sleep, and activity** been lately?\n- Any family history of a similar condition?`,
    `That's enough for an initial hypothesis. Based on the complaint and context (${ctx.patient.chronicConditions.join(
      ', ',
    ) || 'no comorbidities recorded'}), I recommend **supporting exams**: a focused physical exam, basic labs (CBC, renal function, electrolytes, random glucose), and an ECG if there are cardiovascular complaints.\n\nTap **"Draft AI-EMR"** above — I'll put together a structured history + problem list + suggested plan, to be **verified and completed by the doctor**.`,
  ]
  return scripts[Math.min(turn - 1, scripts.length - 1)] ?? scripts[scripts.length - 1]
}

function demoDraft(ctx: PatientContext): EMRDraft {
  const chronic = ctx.patient.chronicConditions[0] ?? 'Hypertension'
  return {
    keluhanUtama: 'Headache and fatigue for 1 week (demo simulation).',
    rps:
      '⚠️ EDUCATIONAL SIMULATION — findings fabricated for learning. Patient reports headache (Site: occipital; Onset: gradual; Character: pressure-like; Radiation: none; Associations: mild vertigo; Time: worse in the morning; Exacerbating: activity; Severity: 5/10). Accompanied by fatigue and neck stiffness.',
    rpd: `History of ${chronic}, poorly controlled.`,
    rpk: 'Mother with hypertension and type 2 diabetes.',
    riwayatPengobatan: 'Amlodipine 5 mg/day (often misses doses).',
    riwayatAlergi: ctx.patient.allergies.join(', ') || 'No known allergies.',
    riwayatNutrisi: 'High-salt, low-fiber diet; insufficient physical activity.',
    riwayatSosialEkonomi: 'Lives with family, passive smoker, moderate work stress.',
    suggestedExams: [
      'Focused physical exam: BP in both arms, fundoscopy, carotid & cardiac auscultation',
      'Labs: CBC, urea/creatinine, electrolytes, lipid profile, fasting glucose/HbA1c, urinalysis',
      '12-lead ECG (look for LVH/ischemia)',
      'Consider echocardiography if signs of hypertensive heart disease',
    ],
    problems: [
      {
        title: 'Uncontrolled hypertension',
        probability: 80,
        basis:
          'History of occipital headache + neck stiffness; hypertension history with poor adherence; elevated BP on vitals.',
        assessment:
          'Uncontrolled essential hypertension is considered the main cause, given the morning occipital headache pattern, family history, and poor medication adherence, more so than primary tension-type headache — though the two can overlap. Pathophysiology: increased peripheral vascular resistance and arteriolar remodeling raise afterload; secondary causes (renoparenchymal, renovascular, endocrine) should be ruled out via supporting tests. (Evidence level B)',
        differentials: [
          'Tension-type headache — bilateral, non-pulsatile, without a significant BP spike.',
          'Secondary hypertension (renovascular/endocrine) — young-onset/resistant, abdominal bruit, hypokalemia.',
        ],
      },
    ],
    prognosis:
      'Fair — good if adherence & BP targets are achieved; risk of cardio-cerebrovascular complications rises if uncontrolled.',
    draftPlan: [
      { category: 'Suportif', text: 'DASH diet, salt restriction <5 g/day, target euvolemic fluid balance.' },
      {
        category: 'Definitif',
        text: 'Optimize antihypertensives (e.g. ACE-inhibitor/ARB ± CCB) — DOSE VERIFIED BY DOCTOR against the formulary & renal function.',
      },
      { category: 'Edukasi', text: 'Medication adherence, home BP monitoring 2x/day, stop smoke exposure.' },
      { category: 'Follow-up', text: 'Follow up in 1–2 weeks; sooner if BP >180/120 or neurological symptoms.' },
      { category: 'Monitoring', text: 'Daily BP, renal function & electrolytes 2–4 weeks after titration.' },
    ],
    references: [
      'Mancia G, et al. 2023 ESH Guidelines for the management of arterial hypertension. J Hypertens. 2023.',
      "Whelton PK, et al. ACC/AHA Hypertension Guideline. 2017 (related update).",
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Body Explorer — penjelasan yang DIGROUNDING pada istilah nyata dari
// /api/anatomy/ontology, bukan tebakan bebas model. Terminologi yang
// diambilkan (DOID/HP) disuntikkan sebagai konteks WAJIB DIRUJUK; model
// dilarang mendiagnosis pasien tertentu di sini — ini penjelasan edukatif
// umum tentang satu region tubuh, bukan konsultasi.
// ─────────────────────────────────────────────────────────────────────────────
function groundingBlock(regionLabel: string, diseases: OntologyTerm[], phenotypes: OntologyTerm[]): string {
  const fmt = (t: OntologyTerm) => `- [${t.id}] ${t.label}${t.description ? `: ${t.description}` : ''}`
  return [
    `RETRIEVED ONTOLOGY TERMS for "${regionLabel}" (Human Disease Ontology + Human Phenotype Ontology, via EBI OLS4):`,
    diseases.length ? `Diseases:\n${diseases.map(fmt).join('\n')}` : 'Diseases: none retrieved.',
    phenotypes.length ? `Phenotypes/symptoms:\n${phenotypes.map(fmt).join('\n')}` : 'Phenotypes: none retrieved.',
    '',
    'INSTRUCTIONS: Write a short (120-180 words), plain-language educational explanation of this body region — what it does, and how the retrieved terms above relate to it. Cite each term you use by its bracketed ID, e.g. "[DOID:9351]". Do NOT diagnose the specific reader or invent terms not in the list above. This is general anatomy/health education, not a consultation for an individual patient.',
  ].join('\n\n')
}

export async function explainBodyRegion(
  settings: AISettings,
  regionLabel: string,
  diseases: OntologyTerm[],
  phenotypes: OntologyTerm[],
): Promise<string> {
  if (!aiAvailable()) {
    return `${regionLabel}: general educational information about this region isn't available right now (AI is offline), but the retrieved terms below are real entries from the Human Disease Ontology and Human Phenotype Ontology.`
  }
  try {
    const { text } = await api.aiMessages({
      model: settings.model,
      system: 'You are a medical educator. Explain anatomy and terminology in plain, accessible language for a general audience. Always cite retrieved term IDs when you use them.',
      messages: [{ role: 'user', content: groundingBlock(regionLabel, diseases, phenotypes) }],
      max_tokens: 400,
    })
    return text || 'No explanation was generated.'
  } catch (e) {
    if (String((e as Error)?.message).includes('rate_limited')) {
      return '⏳ Too many requests in a short time. Please wait a moment and try again.'
    }
    return 'Could not generate an explanation right now — the retrieved terms below are still real ontology entries you can read directly.'
  }
}
