// Sports analytics: position-aware player valuation, a multi-agent scoring
// panel, and embedding-based similarity search.
//
// Two honesty constraints shape the whole module, because sports analytics is
// an area where confident-looking numbers mislead badly:
//
//   1. Every rating is expressed WITH its uncertainty. A player judged on 4
//      matches is not comparable to one judged on 40, and a system that shows
//      both as "84" is lying by omission. Sample size drives a confidence band
//      that is always displayed.
//   2. The agents are allowed to DISAGREE, and the disagreement is surfaced
//      rather than averaged away. When the durability agent and the output
//      agent diverge sharply, that gap is the actual finding — a single blended
//      score would hide exactly the thing a coach needs to see.
//
// No player data ships with this module; everything is entered by the user.

export type Sport = 'sepakbola' | 'basket' | 'futsal' | 'tenis' | 'american-football'

export const SPORT_LABEL: Record<Sport, string> = {
  sepakbola: 'Sepak bola',
  basket: 'Bola basket',
  futsal: 'Futsal',
  tenis: 'Tenis',
  'american-football': 'American football / NFL',
}

/** Metrics differ per sport; each is normalised to a 0-1 scale before scoring. */
export interface MetricDef {
  key: string
  label: string
  /** Value at which the metric is considered elite (maps to 1.0). */
  eliteAt: number
  /** Value at which it is considered replacement level (maps to 0.0). */
  floorAt: number
  /** Lower is better (e.g. turnovers, errors). */
  inverse?: boolean
  hint?: string
}

export const SPORT_METRICS: Record<Sport, MetricDef[]> = {
  sepakbola: [
    { key: 'goalsPer90', label: 'Gol per 90 menit', eliteAt: 0.8, floorAt: 0, hint: 'Penyerang elite ±0,6-0,8' },
    { key: 'assistsPer90', label: 'Assist per 90 menit', eliteAt: 0.5, floorAt: 0 },
    { key: 'passAccuracy', label: 'Akurasi umpan (%)', eliteAt: 92, floorAt: 65 },
    { key: 'duelsWonPct', label: 'Duel dimenangkan (%)', eliteAt: 65, floorAt: 35 },
    { key: 'distanceKm', label: 'Jarak tempuh per laga (km)', eliteAt: 12, floorAt: 7 },
    { key: 'turnoversPer90', label: 'Kehilangan bola per 90', eliteAt: 5, floorAt: 25, inverse: true },
  ],
  basket: [
    { key: 'pointsPerGame', label: 'Poin per laga', eliteAt: 28, floorAt: 4 },
    { key: 'assistsPerGame', label: 'Assist per laga', eliteAt: 9, floorAt: 0.5 },
    { key: 'reboundsPerGame', label: 'Rebound per laga', eliteAt: 12, floorAt: 1 },
    { key: 'trueShootingPct', label: 'True shooting (%)', eliteAt: 63, floorAt: 45 },
    { key: 'stealsBlocksPerGame', label: 'Steal + block per laga', eliteAt: 3.5, floorAt: 0.3 },
    { key: 'turnoversPerGame', label: 'Turnover per laga', eliteAt: 1, floorAt: 5, inverse: true },
  ],
  futsal: [
    { key: 'goalsPerGame', label: 'Gol per laga', eliteAt: 1.5, floorAt: 0 },
    { key: 'assistsPerGame', label: 'Assist per laga', eliteAt: 1.2, floorAt: 0 },
    { key: 'passAccuracy', label: 'Akurasi umpan (%)', eliteAt: 90, floorAt: 60 },
    { key: 'tacklesPerGame', label: 'Rebut bola per laga', eliteAt: 4, floorAt: 0.5 },
    { key: 'shotAccuracy', label: 'Akurasi tembakan (%)', eliteAt: 55, floorAt: 20 },
    { key: 'foulsPerGame', label: 'Pelanggaran per laga', eliteAt: 1, floorAt: 5, inverse: true },
  ],
  tenis: [
    { key: 'firstServePct', label: 'Servis pertama masuk (%)', eliteAt: 70, floorAt: 50 },
    { key: 'firstServeWonPct', label: 'Poin dimenangkan servis 1 (%)', eliteAt: 80, floorAt: 55 },
    { key: 'breakPointsSavedPct', label: 'Break point diselamatkan (%)', eliteAt: 70, floorAt: 40 },
    { key: 'returnPointsWonPct', label: 'Poin return dimenangkan (%)', eliteAt: 45, floorAt: 25 },
    { key: 'winnersPerMatch', label: 'Winner per pertandingan', eliteAt: 45, floorAt: 10 },
    { key: 'unforcedErrorsPerMatch', label: 'Unforced error per laga', eliteAt: 15, floorAt: 55, inverse: true },
  ],
  'american-football': [
    { key: 'yardsPerGame', label: 'Yard per laga', eliteAt: 110, floorAt: 10 },
    { key: 'touchdownsPerGame', label: 'Touchdown per laga', eliteAt: 1.2, floorAt: 0 },
    { key: 'completionPct', label: 'Completion / catch rate (%)', eliteAt: 70, floorAt: 45 },
    { key: 'yardsPerTouch', label: 'Yard per sentuhan', eliteAt: 9, floorAt: 3 },
    { key: 'tacklesPerGame', label: 'Tackle per laga', eliteAt: 8, floorAt: 1 },
    { key: 'turnoversPerGame', label: 'Turnover diberikan per laga', eliteAt: 0.2, floorAt: 2, inverse: true },
  ],
}

export interface Player {
  id: string
  name: string
  sport: Sport
  position: string
  ageYears: number
  /** Matches the stats are drawn from — drives the confidence band. */
  matchesPlayed: number
  /** Matches missed through injury in the same period. */
  matchesMissed: number
  minutesPerMatch: number
  metrics: Record<string, number>
}

// ── Normalisation ────────────────────────────────────────────────────────────

export function normaliseMetric(def: MetricDef, raw: number): number {
  if (!Number.isFinite(raw)) return 0
  const { eliteAt, floorAt } = def
  const span = eliteAt - floorAt
  if (span === 0) return 0
  const v = (raw - floorAt) / span
  return Math.max(0, Math.min(1, v))
}

/** Feature vector used both for scoring and for similarity search. */
export function featureVector(p: Player): number[] {
  const defs = SPORT_METRICS[p.sport]
  return defs.map((d) => normaliseMetric(d, p.metrics[d.key] ?? 0))
}

// ── Multi-agent valuation ────────────────────────────────────────────────────

export interface AgentVerdict {
  agent: string
  /** 0-100. */
  score: number
  focus: string
  reasoning: string
}

export interface Valuation {
  overall: number
  /** +/- band from sample size. Wide band = do not trust the point estimate. */
  confidence: number
  sampleWarning: string | null
  agents: AgentVerdict[]
  /** Spread between highest and lowest agent — the interesting signal. */
  disagreement: number
  disagreementNote: string
}

/**
 * Five independent agents, each looking at one axis only.
 *
 * They are deliberately NOT given each other's outputs. The value of a panel is
 * that it can split; letting them see one another would collapse them toward a
 * consensus that looks confident and tells you less.
 */
export function valuePlayer(p: Player): Valuation {
  const defs = SPORT_METRICS[p.sport]
  const v = featureVector(p)
  const byKey = (k: string) => {
    const i = defs.findIndex((d) => d.key === k)
    return i >= 0 ? v[i] : 0
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

  // 1. Output — raw production, the metric most fans and scouts anchor on.
  const outputKeys = defs.slice(0, 2).map((d) => d.key)
  const output = mean(outputKeys.map(byKey)) * 100

  // 2. Efficiency — doing it without wasting possessions.
  const inverseDefs = defs.filter((d) => d.inverse)
  const efficiencyParts = [
    ...inverseDefs.map((d) => byKey(d.key)),
    ...defs.filter((d) => /accuracy|pct|shooting/i.test(d.key)).map((d) => byKey(d.key)),
  ]
  const efficiency = mean(efficiencyParts.length ? efficiencyParts : [mean(v)]) * 100

  // 3. Durability — availability is a skill, and the most under-priced one.
  const totalPossible = p.matchesPlayed + p.matchesMissed
  const availability = totalPossible > 0 ? p.matchesPlayed / totalPossible : 0
  const loadFactor = Math.min(1, p.minutesPerMatch / 90)
  const durability = (availability * 0.75 + loadFactor * 0.25) * 100

  // 4. Age curve — where the player sits relative to typical peak for the sport.
  const peak = p.sport === 'tenis' ? 25 : p.sport === 'american-football' ? 27 : 27
  const distance = Math.abs(p.ageYears - peak)
  const ageScore = Math.max(0, 100 - distance * 6)

  // 5. All-round — penalises one-dimensional profiles by rewarding the WEAKEST
  //    area, since a glaring hole is what opponents actually attack.
  const weakest = v.length ? Math.min(...v) : 0
  const allRound = weakest * 100

  const agents: AgentVerdict[] = [
    { agent: 'Produksi', score: round(output), focus: 'Hasil mentah', reasoning: 'Menilai keluaran langsung — gol, assist, poin, yard. Ini yang paling terlihat, dan karena itu paling sering dinilai berlebihan.' },
    { agent: 'Efisiensi', score: round(efficiency), focus: 'Biaya per hasil', reasoning: 'Menilai akurasi dan kehilangan bola. Pemain produktif yang boros penguasaan sering menambah lebih sedikit daripada yang terlihat di papan skor.' },
    { agent: 'Ketersediaan', score: round(durability), focus: 'Bisa dimainkan atau tidak', reasoning: 'Persentase laga yang benar-benar dijalani. Ketersediaan adalah keterampilan yang paling sering dihargai terlalu rendah — pemain hebat yang absen separuh musim memberi nilai lebih kecil daripada pemain baik yang selalu siap.' },
    { agent: 'Kurva usia', score: round(ageScore), focus: 'Lintasan, bukan kondisi saat ini', reasoning: `Jarak dari usia puncak tipikal (${peak} tahun). Menilai arah, bukan mutu sekarang — pemain 20 tahun dan 34 tahun dengan statistik identik bukan aset yang sama.` },
    { agent: 'Kelengkapan', score: round(allRound), focus: 'Titik terlemah', reasoning: 'Dinilai dari aspek TERLEMAH, bukan rata-rata. Lawan menyerang celah, bukan rata-rata — profil timpang lebih mudah dinetralkan.' },
  ]

  const scores = agents.map((a) => a.score)
  const disagreement = Math.max(...scores) - Math.min(...scores)
  const overall = round(mean(scores))

  // Sample size drives the honest confidence band.
  const n = Math.max(0, p.matchesPlayed)
  const confidence = n >= 30 ? 3 : n >= 15 ? 6 : n >= 8 ? 10 : n >= 3 ? 16 : 25
  const sampleWarning =
    n === 0 ? 'Belum ada laga tercatat — angka di bawah tidak bermakna.'
    : n < 8 ? `Hanya ${n} laga. Pada sampel sekecil ini, keberuntungan dan lawan yang dihadapi menjelaskan sebagian besar variasi. Perlakukan sebagai kesan awal, bukan penilaian.`
    : n < 15 ? `${n} laga — cukup untuk gambaran kasar, belum cukup untuk keputusan transfer atau kontrak.`
    : null

  const hi = agents.reduce((m, a) => (a.score > m.score ? a : m), agents[0])
  const lo = agents.reduce((m, a) => (a.score < m.score ? a : m), agents[0])
  const disagreementNote =
    disagreement >= 40
      ? `Selisih antar-agen sangat lebar (${round(disagreement)} poin). "${hi.agent}" menilai jauh lebih tinggi daripada "${lo.agent}" — inilah temuan sesungguhnya, bukan skor gabungannya. Pemain seperti ini biasanya sangat baik pada satu hal dan punya kelemahan nyata yang bisa dieksploitasi.`
      : disagreement >= 20
      ? `Selisih antar-agen sedang (${round(disagreement)} poin), terutama antara "${hi.agent}" dan "${lo.agent}". Profil tidak merata; perhatikan konteks penggunaannya.`
      : `Antar-agen relatif sepakat (selisih ${round(disagreement)} poin). Profil merata — skor gabungan cukup mewakili.`

  return { overall, confidence, sampleWarning, agents, disagreement: round(disagreement), disagreementNote }
}

// ── Embedding-based retrieval ────────────────────────────────────────────────

/**
 * Cosine similarity over the normalised feature vector.
 *
 * This is a genuine embedding search, just with an interpretable hand-built
 * feature space rather than a learned one — which for this data is an
 * advantage: every dimension has a name, so a "similar player" result can be
 * explained instead of merely asserted.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || !a.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export interface SimilarPlayer {
  player: Player
  similarity: number
  /** Dimensions where they are closest — makes the match explainable. */
  sharedStrengths: string[]
  biggestDifference: string | null
}

export function findSimilar(target: Player, pool: Player[], topN = 3): SimilarPlayer[] {
  const defs = SPORT_METRICS[target.sport]
  const tv = featureVector(target)

  return pool
    .filter((p) => p.id !== target.id && p.sport === target.sport)
    .map((p) => {
      const pv = featureVector(p)
      const diffs = defs.map((d, i) => ({ label: d.label, diff: Math.abs(tv[i] - pv[i]), level: (tv[i] + pv[i]) / 2 }))
      const shared = diffs
        .filter((d) => d.diff < 0.15 && d.level > 0.55)
        .sort((a, b) => b.level - a.level)
        .slice(0, 2)
        .map((d) => d.label)
      const worst = diffs.reduce((m, d) => (d.diff > m.diff ? d : m), diffs[0])
      return {
        player: p,
        similarity: cosineSimilarity(tv, pv),
        sharedStrengths: shared,
        biggestDifference: worst && worst.diff > 0.25 ? worst.label : null,
      }
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
}

// ── Team view ────────────────────────────────────────────────────────────────

export interface TeamInsight {
  squadSize: number
  averageOverall: number
  averageAge: number
  /** Positions where the squad is thin — the practical output of a roster view. */
  thinPositions: string[]
  injuryLoadPct: number
  notes: string[]
}

export function analyseTeam(players: Player[]): TeamInsight {
  if (!players.length) {
    return { squadSize: 0, averageOverall: 0, averageAge: 0, thinPositions: [], injuryLoadPct: 0, notes: [] }
  }
  const vals = players.map((p) => valuePlayer(p).overall)
  const averageOverall = round(vals.reduce((a, b) => a + b, 0) / vals.length)
  const averageAge = round(players.reduce((a, p) => a + p.ageYears, 0) / players.length)

  const byPos = new Map<string, number>()
  for (const p of players) byPos.set(p.position, (byPos.get(p.position) ?? 0) + 1)
  const thinPositions = [...byPos.entries()].filter(([, n]) => n < 2).map(([pos]) => pos)

  const totalPlayed = players.reduce((a, p) => a + p.matchesPlayed, 0)
  const totalMissed = players.reduce((a, p) => a + p.matchesMissed, 0)
  const injuryLoadPct = totalPlayed + totalMissed > 0 ? round((totalMissed / (totalPlayed + totalMissed)) * 100) : 0

  const notes: string[] = []
  if (thinPositions.length) notes.push(`Hanya satu pemain terdaftar pada posisi: ${thinPositions.join(', ')}. Satu cedera di sana langsung menjadi masalah susunan tim.`)
  if (injuryLoadPct >= 20) notes.push(`${injuryLoadPct}% laga hilang karena cedera. Angka setinggi ini lebih sering menunjuk pada beban latihan atau pemulihan, bukan kesialan.`)
  if (averageAge >= 30) notes.push(`Rata-rata usia ${averageAge} tahun — pertimbangkan regenerasi, karena penurunan pada kelompok ini cenderung terjadi bersamaan.`)
  if (averageAge > 0 && averageAge <= 23) notes.push(`Rata-rata usia ${averageAge} tahun — potensi besar, tetapi konsistensi antar-laga biasanya masih rendah.`)

  return { squadSize: players.length, averageOverall, averageAge, thinPositions, injuryLoadPct, notes }
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}
