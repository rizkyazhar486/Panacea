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
  f.push(tl === 0 ? { area: 'Title tag', status: 'kritis', detail: 'Tidak ada title.', fix: 'Tulis title 50-60 karakter yang memuat kata kunci utama di bagian depan.' }
    : tl < 30 ? { area: 'Title tag', status: 'perlu diperbaiki', detail: `Terlalu pendek (${tl} karakter).`, fix: 'Perpanjang ke 50-60 karakter.' }
    : tl > 60 ? { area: 'Title tag', status: 'perlu diperbaiki', detail: `Terlalu panjang (${tl} karakter) sehingga terpotong di hasil pencarian.`, fix: 'Pangkas ke 50-60 karakter.' }
    : { area: 'Title tag', status: 'baik', detail: `${tl} karakter — panjangnya pas.` })

  const dl = i.metaDescription.trim().length
  f.push(dl === 0 ? { area: 'Meta description', status: 'perlu diperbaiki', detail: 'Kosong — mesin pencari akan mengarang cuplikan sendiri.', fix: 'Tulis 120-158 karakter yang menjelaskan isi halaman dan mengundang klik.' }
    : dl > 158 ? { area: 'Meta description', status: 'perlu diperbaiki', detail: `Terlalu panjang (${dl}), akan terpotong.`, fix: 'Pangkas ke bawah 158 karakter.' }
    : { area: 'Meta description', status: 'baik', detail: `${dl} karakter.` })

  f.push(i.h1Count === 1 ? { area: 'Struktur heading', status: 'baik', detail: 'Tepat satu H1.' }
    : i.h1Count === 0 ? { area: 'Struktur heading', status: 'perlu diperbaiki', detail: 'Tidak ada H1.', fix: 'Tambahkan satu H1 yang menyatakan topik halaman.' }
    : { area: 'Struktur heading', status: 'perlu diperbaiki', detail: `Ada ${i.h1Count} H1.`, fix: 'Sisakan satu H1; sisanya jadikan H2.' })

  f.push(i.wordCount < 300
    ? { area: 'Kedalaman konten', status: 'perlu diperbaiki', detail: `${i.wordCount} kata — tipis untuk halaman yang ingin diperingkat.`, fix: 'Jawab pertanyaan nyata pengguna; jangan menambah kata demi jumlah kata semata.' }
    : { area: 'Kedalaman konten', status: 'baik', detail: `${i.wordCount} kata.` })

  const missingAlt = Math.max(0, i.imagesTotal - i.imagesWithAlt)
  f.push(missingAlt > 0
    ? { area: 'Teks alternatif gambar', status: 'perlu diperbaiki', detail: `${missingAlt} gambar tanpa alt.`, fix: 'Alt bukan hanya soal SEO — ini yang dibacakan pembaca layar kepada pengguna tunanetra. Perbaiki karena alasan itu lebih dulu.' }
    : { area: 'Teks alternatif gambar', status: 'baik', detail: 'Semua gambar punya alt.' })

  f.push(i.loadSeconds > 3
    ? { area: 'Kecepatan muat', status: i.loadSeconds > 5 ? 'kritis' : 'perlu diperbaiki', detail: `${i.loadSeconds.toFixed(1)} detik.`, fix: 'Kompres gambar, tunda skrip yang tidak kritis, dan pecah bundel besar. Kecepatan memengaruhi peringkat sekaligus tingkat pengunjung yang pergi.' }
    : { area: 'Kecepatan muat', status: 'baik', detail: `${i.loadSeconds.toFixed(1)} detik.` })

  f.push(i.mobileFriendly ? { area: 'Mobile', status: 'baik', detail: 'Ramah perangkat seluler.' }
    : { area: 'Mobile', status: 'kritis', detail: 'Tidak ramah seluler.', fix: 'Google memakai versi seluler untuk pengindeksan. Ini prioritas tertinggi.' })

  f.push(i.httpsEnabled ? { area: 'HTTPS', status: 'baik', detail: 'Aktif.' }
    : { area: 'HTTPS', status: 'kritis', detail: 'Tidak aktif.', fix: 'Wajib, terlebih untuk situs kesehatan yang menangani data pribadi.' })

  f.push(i.hasCanonical ? { area: 'Canonical', status: 'baik', detail: 'Ada.' }
    : { area: 'Canonical', status: 'perlu diperbaiki', detail: 'Tidak ada tag canonical.', fix: 'Cegah konten duplikat dari variasi URL.' })

  f.push(i.hasStructuredData ? { area: 'Data terstruktur', status: 'baik', detail: 'Ada schema markup.' }
    : { area: 'Data terstruktur', status: 'perlu diperbaiki', detail: 'Belum ada.', fix: 'Tambahkan schema yang sesuai (Organization, Article, FAQ) agar tampil lebih kaya di hasil pencarian.' })

  f.push(i.internalLinks < 3
    ? { area: 'Tautan internal', status: 'perlu diperbaiki', detail: `${i.internalLinks} tautan.`, fix: 'Tautkan ke halaman terkait agar perayapan dan navigasi lebih baik.' }
    : { area: 'Tautan internal', status: 'baik', detail: `${i.internalLinks} tautan.` })

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
      ? 'Belum boleh disimpulkan — sampel belum mencapai jumlah yang direncanakan.'
      : significant
      ? (p2 > p1 ? 'Variasi menang secara statistik.' : 'Variasi kalah secara statistik.')
      : 'Tidak ada perbedaan yang terdeteksi.',
    warning: !readyToCall
      ? 'Menghentikan uji saat angkanya terlihat bagus adalah kesalahan termahal dalam eksperimen. Mengintip berulang lalu berhenti ketika melewati ambang signifikansi membuat tingkat positif palsu jauh melampaui 5% — Anda akan "memenangkan" uji yang sebenarnya hanya derau, lalu merilis perubahan yang tidak berefek apa pun. Jalankan sampai jumlah sampel yang direncanakan tercapai.'
      : !significant && Math.abs(ciHighPp - ciLowPp) > 4
      ? 'Hasilnya tidak signifikan, tetapi selang kepercayaannya lebar — ini berarti "belum tahu", bukan "tidak ada bedanya". Uji dengan sampel lebih besar bila perbedaan sebesar ini penting bagi Anda.'
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
      s = 'Juara'; action = 'Jangan ganggu dengan promosi. Mintalah masukan dan ulasan — kelompok inilah yang paling jujur dan paling didengar calon pengguna lain.'
    } else if (r >= 3 && f >= 3) {
      s = 'Setia'; action = 'Pertahankan dengan fitur yang benar-benar dipakai, bukan dengan diskon. Diskon kepada orang yang sudah setia hanya menurunkan pendapatan tanpa menambah loyalitas.'
    } else if (r >= 3 && f <= 2) {
      s = 'Baru'; action = 'Fokus pada keberhasilan pertama secepat mungkin. Yang menentukan mereka bertahan adalah merasakan satu manfaat nyata pada minggu pertama.'
    } else if (r === 2 && f >= 2) {
      s = 'Berisiko pergi'; action = 'Hubungi dengan pertanyaan, bukan penawaran. Cari tahu apa yang berubah — sebagian besar pengguna pergi karena satu hambatan yang bisa diperbaiki.'
    } else if (m >= 3) {
      s = 'Berpotensi'; action = 'Pernah bernilai tinggi tetapi jarang kembali. Tunjukkan apa yang baru sejak terakhir mereka datang.'
    } else {
      s = 'Hilang'; action = 'Biaya menarik kembali kelompok ini paling tinggi. Satu upaya jujur, lalu berhenti — mengirim pesan berulang kepada orang yang sudah pergi merusak reputasi pengirim Anda.'
    }
    return { customer: c, segment: s, action }
  })
}

// ── Sentiment ────────────────────────────────────────────────────────────────

const POSITIVE = ['bagus', 'baik', 'mantap', 'membantu', 'cepat', 'mudah', 'ramah', 'puas', 'suka', 'rekomendasi', 'terima kasih', 'jelas', 'akurat', 'lengkap', 'nyaman']
const NEGATIVE = ['buruk', 'jelek', 'lambat', 'susah', 'sulit', 'error', 'bug', 'mahal', 'kecewa', 'bingung', 'gagal', 'lemot', 'ribet', 'tidak akurat', 'menyesatkan', 'rusak']
const NEGATORS = ['tidak', 'bukan', 'kurang', 'belum', 'jangan']

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
    caveat: 'Analisis ini berbasis daftar kata dan tidak memahami sindiran, ulasan campuran, maupun konteks. Gunakan untuk memilah komentar mana yang perlu dibaca lebih dulu — bukan sebagai pengganti membacanya.',
  }
}
