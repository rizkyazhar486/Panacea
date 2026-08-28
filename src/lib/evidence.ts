import { api, backendEnabled } from './api'

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Evidence engine — an UpToDate / AMBOSS / OpenEvidence-style
// "ask a clinical question, get a structured, referenced answer" service.
//
// Design principles that make it usable GLOBALLY (not gated to any one
// country's licensing body):
//  • Synthesis runs through the app's existing server-side AI (no browser key).
//  • Output is STRUCTURED JSON we render in a controlled UI — not free text —
//    so we can label strength of recommendation, evidence certainty, and
//    always show a "verify against primary sources" path.
//  • Because a language model can mis-state or fabricate specific citations,
//    the engine is explicitly framed as decision SUPPORT: every answer ships
//    with live external search links (PubMed, Cochrane, ClinicalTrials.gov,
//    TRIP, NICE, WHO) built from the question, so any clinician anywhere can
//    verify against the actual literature. It never claims to replace primary
//    sources or clinical judgment.
// ─────────────────────────────────────────────────────────────────────────────

export type RecStrength = 'strong-for' | 'conditional-for' | 'uncertain' | 'conditional-against' | 'strong-against'
export type Certainty = 'high' | 'moderate' | 'low' | 'very-low'

export interface EvidencePoint {
  claim: string
  certainty: Certainty
  detail: string
}

export interface EvidenceAnswer {
  question: string
  bottomLine: string
  strength: RecStrength
  overallCertainty: Certainty
  keyPoints: EvidencePoint[]
  considerations: string[]   // populations, contraindications, monitoring, global-context notes
  redFlags: string[]         // when to escalate / refer / not rely on this
  patientFriendly: string    // plain-language version
  disclaimer: string
}

export interface EvidenceFilters {
  specialty?: string
  population?: string   // e.g. adult, pediatric, pregnancy, geriatric
  region?: string       // free-text country/region so guidance can note local variation
  /** Untuk siapa jawabannya ditulis. Mengubah ISI, bukan hanya nada. */
  audiens?: Audiens
}

/**
 * Tiga pembaca, tiga kebutuhan yang benar-benar berbeda.
 *
 * INI BUKAN SEKADAR NADA. Menulis ulang jawaban yang sama dengan kata yang
 * lebih sederhana tidak menolong orang awam: yang ia butuhkan bukan versi
 * ringkas dari pertimbangan dokter, melainkan jawaban atas pertanyaan yang
 * BERBEDA — apa yang harus saya lakukan, dan kapan saya harus khawatir.
 * Mahasiswa membutuhkan yang ketiga lagi: mekanisme, penggolongan, dan
 * jebakan yang muncul di ujian.
 *
 * Yang TIDAK berubah menurut pembacanya: derajat kepastian, tanda bahaya, dan
 * larangan mengarang rujukan. Menurunkan kejujuran demi pembaca yang lebih
 * awam adalah bentuk merendahkan yang paling merugikan.
 */
export type Audiens = 'awam' | 'pelajar' | 'profesional'

export const AUDIENS: { id: Audiens; label: string; untuk: string }[] = [
  { id: 'awam', label: 'Plain language', untuk: 'For anyone. What it means for you, what to do, and when to see someone.' },
  { id: 'pelajar', label: 'Student', untuk: 'For exams: mechanism, classification, first line versus alternatives, and the traps.' },
  { id: 'profesional', label: 'Professional', untuk: 'For clinicians: doses, contraindications, monitoring, and where guidelines diverge.' },
]

const ARAHAN_AUDIENS: Record<Audiens, string> = {
  awam:
    'AUDIENCE: a member of the public with no medical training. Write every sentence so a careful reader with no clinical background can follow it. Expand any term you must use, in the same sentence. Lead with what this means for the person and what they should actually do. Say plainly when something needs a doctor rather than self-management, and never imply the reader can diagnose themselves. Do NOT drop the certainty grading or the red flags — a simpler answer must not become a more confident one. Keep drug names but always pair them with what they are for; give doses only as ranges a prescriber would confirm, never as an instruction to take.',
  pelajar:
    'AUDIENCE: a medical student or resident preparing for board examinations. Emphasise MECHANISM (why the intervention works, at the level of physiology and pharmacology), CLASSIFICATION (how the condition or the drugs are grouped, and what decides which group), FIRST LINE versus alternatives and why, and the mistakes that most often cost marks or harm patients. Give concrete drug names with doses. Where a classic exam distinction exists, state it explicitly.',
  profesional:
    'AUDIENCE: a practising clinician. Full detail: concrete regimens with doses and duration, contraindications, monitoring parameters and their intervals, dose adjustment in renal or hepatic impairment, and where major guidelines disagree with each other. Assume the reader knows the vocabulary; do not spend words explaining it.',
}

const EVIDENCE_SYSTEM = `You are a rigorous clinical-evidence synthesis assistant for licensed health professionals worldwide. You produce structured, source-aware answers in the style of UpToDate / AMBOSS / DynaMed.

STRICT RULES:
- Base answers on well-established, mainstream medical evidence and major international guidelines (WHO, NICE, major specialty societies). Prefer globally applicable guidance; note where recommendations differ by country/region rather than assuming one country.
- NEVER fabricate specific citations, PMIDs, DOIs, trial names, or exact statistics you are not confident are real. If you are unsure of a precise figure or citation, state the direction of evidence qualitatively and lower the certainty rating. It is far better to be honestly uncertain than to invent a reference.
- Grade honestly: use GRADE-style certainty (high/moderate/low/very-low) and recommendation strength.
- Always include red flags / when to escalate, and note key contraindications and monitoring.
- This is decision SUPPORT, not a substitute for primary sources or clinical judgement.

OUTPUT: Return ONLY minified JSON, no prose, no code fences, matching exactly:
{"bottomLine":string,"strength":"strong-for"|"conditional-for"|"uncertain"|"conditional-against"|"strong-against","overallCertainty":"high"|"moderate"|"low"|"very-low","keyPoints":[{"claim":string,"certainty":"high"|"moderate"|"low"|"very-low","detail":string}],"considerations":[string],"redFlags":[string],"patientFriendly":string}`

function buildUserPrompt(q: string, f: EvidenceFilters): string {
  const ctx: string[] = []
  ctx.push(ARAHAN_AUDIENS[f.audiens ?? 'profesional'])
  if (f.specialty) ctx.push(`Specialty focus: ${f.specialty}.`)
  if (f.population) ctx.push(`Population: ${f.population}.`)
  if (f.region) ctx.push(`Clinician's region/country (note local guideline variation where relevant): ${f.region}.`)
  return `${ctx.join(' ')}\n\nClinical question: ${q}\n\nProduce the structured JSON answer now.`
}

/**
 * Extract the answer object from a model reply.
 *
 * The first version took everything between the first '{' and the LAST '}' and
 * handed it to JSON.parse. That works only when the reply is complete. When the
 * generation is cut off at the token limit — which is exactly what happens to a
 * long structured answer — the tail is a half-written object, the last '}' is
 * some inner brace, and the slice is invalid JSON. The user then sees "unexpected
 * format, please rephrase", advice that cannot help because the question was
 * never the problem.
 *
 * So: scan with a brace counter that respects strings and escapes. If the object
 * closes, parse it. If the reply ran out mid-object, CLOSE IT — drop the partial
 * trailing value and shut every open bracket. A truncated answer that renders
 * what did arrive is more useful than an error page, and the missing fields are
 * simply absent rather than wrong.
 */
function safeParse(text: string): Partial<EvidenceAnswer> | null {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  if (start < 0) return null

  // Forward scan. Records, for every position, how many brackets are open and
  // whether we are inside a string — a plain lastIndexOf('}') cannot know
  // either, which is why the old parser mistook an inner brace for the end.
  const opens: string[][] = []
  const inString: boolean[] = []
  const stack: string[] = []
  let inStr = false
  let esc = false

  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i]
    opens.push(stack.slice())
    inString.push(inStr)
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '{') stack.push('}')
    else if (c === '[') stack.push(']')
    else if (c === '}' || c === ']') {
      stack.pop()
      if (stack.length === 0) {
        try { return JSON.parse(cleaned.slice(start, i + 1)) } catch { return null }
      }
    }
  }

  /*
   * The reply ran out with brackets still open — the generation hit its token
   * limit mid-object. Rather than guess one cut point, walk backwards through
   * the positions where a value could plausibly have ended, close whatever is
   * still open there, and let JSON.parse be the judge. The first candidate that
   * parses wins. A partial answer that renders what did arrive beats an error
   * page; the fields that never arrived are simply absent, never invented.
   */
  for (let i = cleaned.length - 1; i > start; i--) {
    const rel = i - start
    if (inString[rel]) continue
    const c = cleaned[i]
    if (c !== ',' && c !== '}' && c !== ']' && c !== '"') continue
    let head = cleaned.slice(start, c === ',' ? i : i + 1)
    // Drop a trailing separator and any key left without its value.
    head = head.replace(/,\s*$/, '').replace(/,?\s*"[^"\\]*"\s*:\s*$/, '')
    if (!head || head === '{') continue
    const closers = opens[c === ',' ? rel : rel + 1] ?? opens[rel]
    const repaired = head + closers.slice().reverse().join('')
    try {
      const v = JSON.parse(repaired) as Partial<EvidenceAnswer>
      if (v && typeof v === 'object') return v
    } catch { /* try an earlier boundary */ }
  }
  return null
}

const DISCLAIMER = 'AI-generated evidence synthesis for licensed health professionals. It may be incomplete or out of date and can contain errors — verify against the primary sources and current local guidelines linked below before any clinical decision. Not a substitute for clinical judgement.'

export function evidenceAvailable(): boolean { return backendEnabled }

export interface PubmedArticle {
  pmid: string; title: string; authors: string; journal: string; year: string; url: string
}

// Live journal retrieval: fetch real, currently-indexed PubMed articles for the
// question via the backend (NCBI E-utilities). Returns [] on any failure so the
// UI degrades gracefully to the manual verification links.
export async function fetchRelatedArticles(question: string): Promise<PubmedArticle[]> {
  if (!backendEnabled) return []
  try {
    const r = await api.searchPubmed(question)
    return r.articles ?? []
  } catch { return [] }
}

// ── Access control ───────────────────────────────────────────────────────────
// Pricing: the first 10 accounts to ever open the engine are granted unlimited
// free access forever ("founding users"). Everyone else gets a small free
// allowance, then each query costs 150 PNC (= Rp150,000). The global first-10
// claim is best-effort: it's persisted per device here and mirrored to the
// backend when available (a server-authoritative counter is the real source of
// truth once the backend endpoint is deployed).
export const EVIDENCE_PRICE_PNC = 150
export const EVIDENCE_FREE_ALLOWANCE = 10   // free lifetime questions for non-founding users
export const EVIDENCE_FOUNDER_SLOTS = 10    // first N users are free forever

const USED_KEY = 'pmd_evidence_used_v1'
const FOUNDER_KEY = 'pmd_evidence_founder_v1'   // '1' if this account claimed a founder slot
const SLOTS_KEY = 'pmd_evidence_slots_v1'       // locally-seen count of claimed founder slots

export function evidenceUsedCount(): number {
  try { return Math.max(0, parseInt(localStorage.getItem(USED_KEY) || '0', 10)) || 0 } catch { return 0 }
}
export function isEvidenceFounder(): boolean {
  try { return localStorage.getItem(FOUNDER_KEY) === '1' } catch { return false }
}

// Claim a founder slot on first visit if any of the first 10 remain. Returns
// whether this user is a founder (unlimited free). Best-effort local counter.
export function claimFounderIfEligible(): boolean {
  try {
    if (localStorage.getItem(FOUNDER_KEY) === '1') return true
    const claimed = Math.max(0, parseInt(localStorage.getItem(SLOTS_KEY) || '0', 10)) || 0
    if (claimed < EVIDENCE_FOUNDER_SLOTS) {
      localStorage.setItem(SLOTS_KEY, String(claimed + 1))
      localStorage.setItem(FOUNDER_KEY, '1')
      return true
    }
    return false
  } catch { return false }
}

export interface EvidenceGate {
  founder: boolean
  freeRemaining: number   // free questions left (Infinity for founders)
  needsPayment: boolean   // true when the next query must be paid
  pricePnc: number
}

export function evidenceGate(): EvidenceGate {
  const founder = isEvidenceFounder()
  if (founder) return { founder: true, freeRemaining: Infinity, needsPayment: false, pricePnc: 0 }
  const used = evidenceUsedCount()
  const freeRemaining = Math.max(0, EVIDENCE_FREE_ALLOWANCE - used)
  return { founder: false, freeRemaining, needsPayment: freeRemaining <= 0, pricePnc: EVIDENCE_PRICE_PNC }
}

// Record that a free question was consumed (founders & paid queries don't count).
export function recordFreeQuery(): void {
  try { localStorage.setItem(USED_KEY, String(evidenceUsedCount() + 1)) } catch { /* ignore */ }
}

/**
 * Galat yang MEMBAWA jawabannya.
 *
 * Sebelum ini kegagalan urai hanya melempar 'parse_failed', dan layar berkata
 * "jawabannya tidak dapat dibaca". Itu benar tetapi tidak berguna bagi siapa
 * pun: pemakainya tidak tahu apa yang harus dilakukan, dan yang memperbaiki
 * tidak tahu apa yang sebenarnya kembali. Satu putaran laporan hilang setiap
 * kali. Sekarang teks aslinya ikut dibawa dan dapat ditampilkan.
 */
export class GagalUrai extends Error {
  mentah: string
  constructor(pesan: string, mentah: string) {
    super(pesan)
    this.name = 'GagalUrai'
    this.mentah = mentah
  }
}

/**
 * Terima bentuk yang MELESET SEDIKIT, jangan tolak seluruhnya.
 *
 * Skema meminta bottomLine. Penyedia yang berbeda mengembalikan bottom_line,
 * bottomline, atau summary untuk maksud yang sama persis, dan menolak jawaban
 * yang isinya benar hanya karena namanya berbeda satu garis bawah adalah
 * kegagalan yang seluruhnya buatan kita sendiri.
 *
 * Yang TIDAK dilakukan: mengarang isi. Bila memang tidak ada satu pun bentuk
 * yang membawa kesimpulan, nilainya kosong dan layar mengatakannya kosong.
 */
function ambilKesimpulan(o: Record<string, unknown>): string {
  for (const k of ['bottomLine', 'bottom_line', 'bottomline', 'summary', 'conclusion']) {
    const v = o[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function ambilDaftar(o: Record<string, unknown>, ...kunci: string[]): unknown[] {
  for (const k of kunci) {
    const v = o[k]
    if (Array.isArray(v)) return v
  }
  return []
}

/** Apakah objek ini membawa isi yang layak ditampilkan sama sekali? */
function adaIsinya(o: Record<string, unknown> | null): boolean {
  if (!o) return false
  return Boolean(
    ambilKesimpulan(o) ||
    ambilDaftar(o, 'keyPoints', 'key_points').length ||
    ambilDaftar(o, 'considerations').length ||
    ambilDaftar(o, 'redFlags', 'red_flags').length,
  )
}

export async function askClinicalEvidence(question: string, filters: EvidenceFilters = {}): Promise<EvidenceAnswer> {
  const q = question.trim()
  if (!q) throw new Error('empty_question')
  if (!backendEnabled) throw new Error('backend_unavailable')

  // Satu permintaan, dan bila bentuknya meleset, SATU perbaikan.
  const minta = (pesan: { role: 'user' | 'assistant'; content: string }[]) =>
    api.aiMessages({
      // 'opus' marks this as a reasoning-grade request, and `json` tells the
      // server the reply will be machine-parsed — both are required for the
      // answer to come back as a bare object rather than chatty prose. The old
      // value here was an OpenRouter-style slug that matched no route at all.
      model: 'claude-opus-4-8',
      json: true,
      system: EVIDENCE_SYSTEM,
      messages: pesan,
      // The schema has seven fields, several of them lists of full sentences.
      // 2048 tokens truncated ordinary answers mid-object.
      max_tokens: 4096,
    })

  const awal = buildUserPrompt(q, filters)
  let { text } = await minta([{ role: 'user', content: awal }])
  let parsed = safeParse(text) as Record<string, unknown> | null

  if (!adaIsinya(parsed)) {
    /*
     * SEKALI DIPERBAIKI SEBELUM MENYERAH.
     *
     * Kegagalan yang benar-benar terjadi hampir selalu bentuk, bukan isi:
     * objek dibungkus prosa, dibungkus pagar kode, atau dibungkus satu lapis
     * kunci tambahan. Meminta ulang dengan menunjukkan balasan sebelumnya
     * memperbaikinya jauh lebih sering daripada tidak — dan itu satu permintaan
     * tambahan, bukan pertanyaan baru, jadi tidak ada yang ditagihkan lagi.
     *
     * Bila percobaan kedua pun gagal, barulah menyerah — dan menyerah sambil
     * MEMBAWA teks aslinya, supaya sebabnya dapat dilihat alih-alih ditebak.
     */
    const r2 = await minta([
      { role: 'user', content: awal },
      { role: 'assistant', content: text.slice(0, 3000) },
      { role: 'user', content: 'That reply could not be parsed. Return the SAME content again as a single minified JSON object matching the schema exactly, with no prose, no code fences, and no wrapper key. Start with { and end with }.' },
    ]).catch(() => ({ text: '' }))
    if (r2.text) {
      const p2 = safeParse(r2.text) as Record<string, unknown> | null
      if (adaIsinya(p2)) { parsed = p2; text = r2.text }
    }
  }

  if (!adaIsinya(parsed)) {
    /*
     * SEBUTKAN SEBABNYA, JANGAN HANYA MENYEBUT GAGALNYA.
     *
     * Perbaikan Clinical Evidence berada di SERVER, bukan di aplikasi ini.
     * Selama server yang terpasang masih versi lama, jawabannya kembali
     * sebagai prosa yang tidak dapat diurai.
     *
     * Server yang sudah diperbarui menyebutkan kemampuannya pada /api/health.
     * Bila penanda itu tidak ada, itulah sebabnya, dan itu yang disampaikan.
     */
    let serverLama = false
    try {
      const h = await api.health()
      serverLama = !h.kemampuan?.evidenceJson
    } catch {
      // Tidak dapat memastikan; jangan menuduh servernya usang tanpa bukti.
    }
    if (serverLama) throw new GagalUrai('server_lama', text)
    throw new GagalUrai(text.trim() ? 'parse_failed' : 'empty_reply', text)
  }

  const o = parsed as Record<string, unknown>
  const titik = ambilDaftar(o, 'keyPoints', 'key_points')
    .filter((p): p is { claim: string } => Boolean(p && typeof p === 'object' && (p as { claim?: unknown }).claim))
  return {
    question: q,
    // Boleh kosong. Layar mengatakannya kosong; tidak ada kesimpulan yang
    // dikarang untuk menutupi ketiadaannya.
    bottomLine: ambilKesimpulan(o),
    strength: ((o.strength as RecStrength) ?? 'uncertain'),
    overallCertainty: ((o.overallCertainty ?? o.certainty) as Certainty) ?? 'low',
    keyPoints: titik as EvidenceAnswer['keyPoints'],
    considerations: ambilDaftar(o, 'considerations').filter((x): x is string => typeof x === 'string'),
    redFlags: ambilDaftar(o, 'redFlags', 'red_flags').filter((x): x is string => typeof x === 'string'),
    patientFriendly: typeof o.patientFriendly === 'string' ? o.patientFriendly
      : typeof o.patient_friendly === 'string' ? o.patient_friendly : '',
    disclaimer: DISCLAIMER,
  }
}

// Live external verification links, built from the question so any clinician
// worldwide can check the actual literature. These need no login and are not
// region-locked.
export function verificationLinks(question: string): { label: string; url: string; note: string }[] {
  const q = encodeURIComponent(question.trim())
  return [
    { label: 'PubMed', url: `https://pubmed.ncbi.nlm.nih.gov/?term=${q}`, note: 'Primary biomedical literature (NLM)' },
    { label: 'Cochrane Library', url: `https://www.cochranelibrary.com/search?q=${q}`, note: 'Systematic reviews' },
    { label: 'ClinicalTrials.gov', url: `https://clinicaltrials.gov/search?term=${q}`, note: 'Registered trials & results' },
    { label: 'TRIP Database', url: `https://www.tripdatabase.com/search?criteria=${q}`, note: 'Evidence-based answers & guidelines' },
    { label: 'NICE Guidance', url: `https://www.nice.org.uk/search?q=${q}`, note: 'UK national guidelines' },
    { label: 'WHO', url: `https://www.who.int/home/search?query=${q}`, note: 'Global health guidance' },
  ]
}

export const STRENGTH_META: Record<RecStrength, { label: string; tone: 'brand' | 'low' | 'neutral' | 'critical' }> = {
  'strong-for': { label: 'Strong — for', tone: 'brand' },
  'conditional-for': { label: 'Conditional — for', tone: 'low' },
  uncertain: { label: 'Uncertain / insufficient', tone: 'neutral' },
  'conditional-against': { label: 'Conditional — against', tone: 'low' },
  'strong-against': { label: 'Strong — against', tone: 'critical' },
}

export const CERTAINTY_META: Record<Certainty, { label: string; tone: 'brand' | 'low' | 'neutral' | 'critical' }> = {
  high: { label: 'High certainty', tone: 'brand' },
  moderate: { label: 'Moderate certainty', tone: 'low' },
  low: { label: 'Low certainty', tone: 'neutral' },
  'very-low': { label: 'Very low certainty', tone: 'critical' },
}
