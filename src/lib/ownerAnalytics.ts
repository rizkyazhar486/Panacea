// Owner analytics: SEO audit, A/B testing, customer segmentation, sentiment.
//
// The A/B section is where this module takes the strongest position. Most
// split-test dashboards show a running "winner" and a conversion-rate delta,
// which invites the single most expensive mistake in experimentation: watching
// until the numbers look good and stopping there. Peeking at a test repeatedly
// and stopping when it crosses significance inflates the false-positive rate
// far above the nominal 5% — you will "win" tests that are pure noise and then
// ship changes that do nothing. So this computes a real two-proportion z-test,
// refuses to call a result before the pre-committed sample size is reached, and
// says so plainly rather than showing an encouraging number.

// ── SEO ──────────────────────────────────────────────────────────────────────

export interface SeoInput {
  title: string
  metaDescription: string
  h1Count: number
  wordCount: number
  imagesTotal: number
  imagesWithAlt: number
  hasCanonical: boolean
  mobileFriendly: boolean
  loadSeconds: number
  internalLinks: number
  httpsEnabled: boolean
  hasStructuredData: boolean
}

export interface SeoFinding {
  area: string
  status: 'baik' | 'perlu diperbaiki' | 'kritis'
  detail: string
  fix?: string
}

export function auditSeo(i: SeoInput): { findings: SeoFinding[]; score: number } {
  const f: SeoFinding[] = []

  const tl = i.title.trim().length
  f.push(tl === 0 ? { area: 'Title tag', status: 'kritis', detail: 'No title at all.', fix: 'Write a 50–60 character title with the main keyword near the front.' }
    : tl < 30 ? { area: 'Title tag', status: 'perlu diperbaiki', detail: `Too short (${tl} characters).`, fix: 'Extend it to 50–60 characters.' }
    : tl > 60 ? { area: 'Title tag', status: 'perlu diperbaiki', detail: `Too long (${tl} characters), so it gets truncated in search results.`, fix: 'Trim it to 50–60 characters.' }
    : { area: 'Title tag', status: 'baik', detail: `${tl} characters — a good length.` })

  const dl = i.metaDescription.trim().length
  f.push(dl === 0 ? { area: 'Meta description', status: 'perlu diperbaiki', detail: 'Empty — search engines will invent their own snippet.', fix: 'Write 120–158 characters that describe the page and invite a click.' }
    : dl > 158 ? { area: 'Meta description', status: 'perlu diperbaiki', detail: `Too long (${dl}); it will be truncated.`, fix: 'Trim it below 158 characters.' }
    : { area: 'Meta description', status: 'baik', detail: `${dl} characters.` })

  f.push(i.h1Count === 1 ? { area: 'Heading structure', status: 'baik', detail: 'Exactly one H1.' }
    : i.h1Count === 0 ? { area: 'Heading structure', status: 'perlu diperbaiki', detail: 'No H1.', fix: 'Add a single H1 stating the topic of the page.' }
    : { area: 'Heading structure', status: 'perlu diperbaiki', detail: `${i.h1Count} H1 tags.`, fix: 'Keep one H1; turn the rest into H2s.' })

  f.push(i.wordCount < 300
    ? { area: 'Content depth', status: 'perlu diperbaiki', detail: `${i.wordCount} words — thin for a page meant to rank.`, fix: 'Answer real user questions; do not add words for the sake of the count.' }
    : { area: 'Content depth', status: 'baik', detail: `${i.wordCount} words.` })

  const missingAlt = Math.max(0, i.imagesTotal - i.imagesWithAlt)
  f.push(missingAlt > 0
    ? { area: 'Image alt text', status: 'perlu diperbaiki', detail: `${missingAlt} images without alt text.`, fix: 'Alt text is not only an SEO matter — it is what a screen reader speaks to a blind user. Fix it for that reason first.' }
    : { area: 'Image alt text', status: 'baik', detail: 'Every image has alt text.' })

  f.push(i.loadSeconds > 3
    ? { area: 'Load speed', status: i.loadSeconds > 5 ? 'kritis' : 'perlu diperbaiki', detail: `${i.loadSeconds.toFixed(1)} seconds.`, fix: 'Compress images, defer non-critical scripts, and split large bundles. Speed affects both ranking and how many visitors leave.' }
    : { area: 'Load speed', status: 'baik', detail: `${i.loadSeconds.toFixed(1)} seconds.` })

  f.push(i.mobileFriendly ? { area: 'Mobile', status: 'baik', detail: 'Mobile friendly.' }
    : { area: 'Mobile', status: 'kritis', detail: 'Not mobile friendly.', fix: 'Google indexes the mobile version. This is the highest priority.' })

  f.push(i.httpsEnabled ? { area: 'HTTPS', status: 'baik', detail: 'Enabled.' }
    : { area: 'HTTPS', status: 'kritis', detail: 'Not enabled.', fix: 'Mandatory, all the more so for a health site handling personal data.' })

  f.push(i.hasCanonical ? { area: 'Canonical', status: 'baik', detail: 'Present.' }
    : { area: 'Canonical', status: 'perlu diperbaiki', detail: 'No canonical tag.', fix: 'Prevent duplicate content from URL variations.' })

  f.push(i.hasStructuredData ? { area: 'Structured data', status: 'baik', detail: 'Schema markup present.' }
    : { area: 'Structured data', status: 'perlu diperbaiki', detail: 'None yet.', fix: 'Add the appropriate schema (Organization, Article, FAQ) for richer search results.' })

  f.push(i.internalLinks < 3
    ? { area: 'Internal links', status: 'perlu diperbaiki', detail: `${i.internalLinks} links.`, fix: 'Link to related pages to improve crawling and navigation.' }
    : { area: 'Internal links', status: 'baik', detail: `${i.internalLinks} links.` })

  const score = Math.round((f.filter((x) => x.status === 'baik').length / f.length) * 100)
  return { findings: f, score }
}

// ── A/B testing ──────────────────────────────────────────────────────────────

export interface AbInput {
  controlVisitors: number
  controlConversions: number
  variantVisitors: number
  variantConversions: number
  /** Sample size per arm committed to BEFORE the test started. */
  plannedPerArm: number
}

export interface AbResult {
  controlRate: number
  variantRate: number
  absoluteLiftPp: number
  relativeLiftPct: number
  zScore: number
  pValue: number
  significant: boolean
  /** 95% CI on the absolute difference, percentage points. */
  ciLowPp: number
  ciHighPp: number
  readyToCall: boolean
  verdict: string
  warning: string | null
}

/** Two-tailed p-value from a z-score, via an Abramowitz-Stegun normal CDF. */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (1.330274429 * t ** 4 - 1.821255978 * t ** 3 + 1.781477937 * t ** 2 - 0.356563782 * t + 0.319381530)
  return z > 0 ? 1 - p : p
}

export function analyseAb(i: AbInput): AbResult {
  const n1 = Math.max(i.controlVisitors, 0)
  const n2 = Math.max(i.variantVisitors, 0)
  const p1 = n1 > 0 ? i.controlConversions / n1 : 0
  const p2 = n2 > 0 ? i.variantConversions / n2 : 0

  const pooled = n1 + n2 > 0 ? (i.controlConversions + i.variantConversions) / (n1 + n2) : 0
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / Math.max(n1, 1) + 1 / Math.max(n2, 1)))
  const z = se > 0 ? (p2 - p1) / se : 0
  const pValue = 2 * (1 - normalCdf(Math.abs(z)))

  // CI uses the unpooled standard error, which is the correct one for
  // estimating the size of the difference (pooled is for the null test).
  const seDiff = Math.sqrt((p1 * (1 - p1)) / Math.max(n1, 1) + (p2 * (1 - p2)) / Math.max(n2, 1))
  const ciLowPp = ((p2 - p1) - 1.96 * seDiff) * 100
  const ciHighPp = ((p2 - p1) + 1.96 * seDiff) * 100

  const readyToCall = n1 >= i.plannedPerArm && n2 >= i.plannedPerArm
  const significant = pValue < 0.05 && readyToCall

  return {
    controlRate: p1 * 100,
    variantRate: p2 * 100,
    absoluteLiftPp: (p2 - p1) * 100,
    relativeLiftPct: p1 > 0 ? ((p2 - p1) / p1) * 100 : 0,
    zScore: z,
    pValue,
    significant,
    ciLowPp, ciHighPp,
    readyToCall,
    verdict: !readyToCall
      ? 'Too early to call — the sample has not reached the planned size.'
      : significant
      ? (p2 > p1 ? 'The variant wins, statistically.' : 'The variant loses, statistically.')
      : 'No difference detected.',
    warning: !readyToCall
      ? 'Stopping a test the moment the numbers look good is the most expensive mistake in experimentation. Peeking repeatedly and stopping when significance is crossed pushes the false-positive rate far above 5% — you will "win" a test that was only noise, then ship a change that does nothing. Run it until the planned sample size is reached.'
      : !significant && Math.abs(ciHighPp - ciLowPp) > 4
      ? 'The result is not significant, but the confidence interval is wide — that means "we do not know yet", not "there is no difference". Test with a larger sample if a difference this size matters to you.'
      : null,
  }
}

/**
 * Sample size per arm for a given baseline rate and the smallest lift worth
 * detecting, at 80% power and 5% significance.
 */
export function requiredSampleSize(baselineRatePct: number, minDetectableLiftPp: number): number {
  const p = baselineRatePct / 100
  const d = minDetectableLiftPp / 100
  if (p <= 0 || p >= 1 || d <= 0) return 0
  const zA = 1.96, zB = 0.84
  const pBar = p + d / 2
  return Math.ceil(((zA + zB) ** 2 * 2 * pBar * (1 - pBar)) / (d * d))
}

// ── Customer segmentation (RFM) ──────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  daysSinceLastUse: number
  usesLast90Days: number
  totalSpend: number
}

export type SegmentName = 'Juara' | 'Setia' | 'Berpotensi' | 'Baru' | 'Berisiko pergi' | 'Hilang'

// Nilai SegmentName, status audit, dan label sentimen dibandingkan dengan ===
// di halaman, jadi nilainya tidak diterjemahkan. Yang diterjemahkan labelnya.
export const SEGMENT_LABEL: Record<SegmentName, string> = {
  Juara: 'Champion', Setia: 'Loyal', Berpotensi: 'Promising', Baru: 'New',
  'Berisiko pergi': 'At risk of leaving', Hilang: 'Lost',
}
export const SEO_STATUS_LABEL: Record<SeoFinding['status'], string> = {
  baik: 'good', 'perlu diperbaiki': 'needs work', kritis: 'critical',
}
export const SENTIMENT_LABEL: Record<SentimentResult['label'], string> = {
  positif: 'positive', netral: 'neutral', negatif: 'negative',
}

export interface Segment {
  customer: Customer
  segment: SegmentName
  action: string
}

function scoreRecency(d: number): number { return d <= 7 ? 4 : d <= 30 ? 3 : d <= 90 ? 2 : 1 }
function scoreFrequency(n: number): number { return n >= 20 ? 4 : n >= 8 ? 3 : n >= 3 ? 2 : 1 }
function scoreMonetary(v: number, median: number): number {
  return v >= median * 2 ? 4 : v >= median ? 3 : v > 0 ? 2 : 1
}

export function segment(customers: Customer[]): Segment[] {
  const spends = customers.map((c) => c.totalSpend).sort((a, b) => a - b)
  const median = spends.length ? spends[Math.floor(spends.length / 2)] : 0

  return customers.map((c) => {
    const r = scoreRecency(c.daysSinceLastUse)
    const f = scoreFrequency(c.usesLast90Days)
    const m = scoreMonetary(c.totalSpend, median)

    let s: SegmentName
    let action: string
    if (r >= 3 && f >= 3 && m >= 3) {
      s = 'Juara'; action = 'Do not interrupt them with promotions. Ask for feedback and reviews — this group is the most honest, and the one prospective users listen to most.'
    } else if (r >= 3 && f >= 3) {
      s = 'Setia'; action = 'Keep them with features they actually use, not with discounts. Discounting to the already-loyal only lowers revenue without adding loyalty.'
    } else if (r >= 3 && f <= 2) {
      s = 'Baru'; action = 'Focus on their first success as fast as possible. What decides whether they stay is feeling one real benefit in the first week.'
    } else if (r === 2 && f >= 2) {
      s = 'Berisiko pergi'; action = 'Reach out with a question, not an offer. Find out what changed — most users leave over a single fixable obstacle.'
    } else if (m >= 3) {
      s = 'Berpotensi'; action = 'Once high value but rarely back. Show them what is new since their last visit.'
    } else {
      s = 'Hilang'; action = 'Winning this group back costs the most. One honest attempt, then stop — repeatedly messaging people who have left damages your sender reputation.'
    }
    return { customer: c, segment: s, action }
  })
}

// ── Sentiment ────────────────────────────────────────────────────────────────

const POSITIVE = [
  'bagus', 'baik', 'mantap', 'membantu', 'cepat', 'mudah', 'ramah', 'puas', 'suka', 'rekomendasi', 'terima kasih', 'jelas', 'akurat', 'lengkap', 'nyaman',
  'good', 'great', 'helpful', 'fast', 'easy', 'clear', 'accurate', 'love', 'excellent', 'useful', 'simple', 'reliable',
]
const NEGATIVE = [
  'buruk', 'jelek', 'lambat', 'susah', 'sulit', 'error', 'bug', 'mahal', 'kecewa', 'bingung', 'gagal', 'lemot', 'ribet', 'tidak akurat', 'menyesatkan', 'rusak',
  'bad', 'slow', 'hard', 'difficult', 'expensive', 'confusing', 'broken', 'crash', 'useless', 'misleading', 'disappointing',
]
const NEGATORS = ['tidak', 'bukan', 'kurang', 'belum', 'jangan', 'not', 'never', 'no']

export interface SentimentResult {
  label: 'positif' | 'netral' | 'negatif'
  score: number
  matchedPositive: string[]
  matchedNegative: string[]
  caveat: string
}

/**
 * Lexicon sentiment. Deliberately simple, and its limits are surfaced in the
 * result rather than hidden: it cannot read sarcasm, mixed reviews, or context,
 * and a product decision made from an automated sentiment score alone will
 * eventually be badly wrong. It is a triage aid for finding which comments to
 * read, not a replacement for reading them.
 */
export function analyseSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  const matchedPositive: string[] = []
  const matchedNegative: string[] = []
  let score = 0

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const prev = i > 0 ? words[i - 1] : ''
    const negated = NEGATORS.includes(prev)
    if (POSITIVE.includes(w)) {
      if (negated) { score -= 1; matchedNegative.push(`${prev} ${w}`) }
      else { score += 1; matchedPositive.push(w) }
    } else if (NEGATIVE.includes(w)) {
      if (negated) { score += 1; matchedPositive.push(`${prev} ${w}`) }
      else { score -= 1; matchedNegative.push(w) }
    }
  }

  return {
    score,
    label: score > 0 ? 'positif' : score < 0 ? 'negatif' : 'netral',
    matchedPositive, matchedNegative,
    caveat: 'This analysis is word-list based and understands neither sarcasm, mixed reviews, nor context. Use it to triage which comments to read first — not as a substitute for reading them.',
  }
}
