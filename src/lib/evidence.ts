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
  if (f.specialty) ctx.push(`Specialty focus: ${f.specialty}.`)
  if (f.population) ctx.push(`Population: ${f.population}.`)
  if (f.region) ctx.push(`Clinician's region/country (note local guideline variation where relevant): ${f.region}.`)
  return `${ctx.join(' ')}\n\nClinical question: ${q}\n\nProduce the structured JSON answer now.`
}

function safeParse(text: string): Partial<EvidenceAnswer> | null {
  // Strip any accidental code fences / leading prose, then grab the JSON object.
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
}

const DISCLAIMER = 'AI-generated evidence synthesis for licensed health professionals. It may be incomplete or out of date and can contain errors — verify against the primary sources and current local guidelines linked below before any clinical decision. Not a substitute for clinical judgement.'

export function evidenceAvailable(): boolean { return backendEnabled }

export async function askClinicalEvidence(question: string, filters: EvidenceFilters = {}): Promise<EvidenceAnswer> {
  const q = question.trim()
  if (!q) throw new Error('empty_question')
  if (!backendEnabled) throw new Error('backend_unavailable')

  const { text } = await api.aiMessages({
    model: 'anthropic/claude-3.5-sonnet',
    system: EVIDENCE_SYSTEM,
    messages: [{ role: 'user', content: buildUserPrompt(q, filters) }],
    max_tokens: 2048,
  })
  const parsed = safeParse(text)
  if (!parsed || !parsed.bottomLine) throw new Error('parse_failed')

  return {
    question: q,
    bottomLine: parsed.bottomLine,
    strength: (parsed.strength as RecStrength) ?? 'uncertain',
    overallCertainty: (parsed.overallCertainty as Certainty) ?? 'low',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter((p) => p && p.claim) : [],
    considerations: Array.isArray(parsed.considerations) ? parsed.considerations : [],
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    patientFriendly: parsed.patientFriendly ?? '',
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
