// Kernel studi validasi klinis prospektif.
//
// PRINSIP: kode ini membuat validasi oleh klinisi SUNGGUHAN dapat dijalankan,
// diukur, direproduksi dan diaudit. Ia TIDAK PERNAH menghasilkan penilaian klinis
// sendiri. Tanpa penilaian manusia, setiap metrik bernilai null dan laporan
// menyatakan "belum ada data manusia" — bukan 0%, bukan 100%.
//
// Isi:
// - Protokol: titik akhir & ambang DITETAPKAN SEBELUM evaluasi, dibekukan dengan
//   sidik SHA-256; mengubahnya = protokol versi baru, bukan menimpa.
// - Kasus beku: keluaran sistem + versi sistem, masing-masing bersidik.
// - Penilaian: identitas/peran/kredensial/cakupan/konflik kepentingan penilai,
//   benar/salah, klaim tak didukung, omisi, tingkat bahaya, override, waktu tinjau.
// - Adjudikasi ketidaksepakatan, kejadian keselamatan & near-miss.
// - Buku besar append-only berantai hash: penulisan ulang diam-diam terdeteksi.
// - Metrik dengan n dan IK 95% Wilson; Cohen's kappa antar-penilai.
// - Laporan ekspor yang memisahkan penerimaan rekayasa dari validasi klinis.

export const VERSI_KERNEL_VALIDASI = 'validasi-klinis-1'

export type IdMetrik =
  | 'correctness' | 'omission' | 'unsupported-claim' | 'harmful' | 'override'
  | 'inter-rater-kappa' | 'time-to-review-ms'

export interface TitikAkhir {
  metrik: IdMetrik
  /** Definisi operasional yang dibaca penilai, ditulis sebelum evaluasi. */
  definisi: string
  /** Ambang keberhasilan yang ditetapkan sebelumnya, mis. { arah: 'maks', nilai: 0.05 }. */
  ambang: { arah: 'min' | 'maks'; nilai: number }
}

export interface Protokol {
  id: string
  versi: number
  judul: string
  alur: string
  titikAkhir: TitikAkhir[]
  /** Minimal penilai independen per kasus (≥2 untuk kappa). */
  penilaiPerKasus: number
  /** Batas etika/persetujuan yang berlaku — dinyatakan, bukan diasumsikan. */
  etika: { butuhPersetujuanEtik: boolean; nomorPersetujuan?: string; dataPasienNyata: boolean; catatan: string }
  dibekukanPada: string
}

export interface KasusBeku {
  id: string
  protokolId: string
  /** Versi sistem/model yang menghasilkan keluaran ini — wajib untuk reproduksi. */
  versiSistem: string
  /** Masukan terdeidentifikasi dan keluaran sistem apa adanya, sebagai JSON kanonik. */
  masukan: unknown
  keluaran: unknown
  /** Keadaan semantik keluaran: measured / derived / rule-output / ai-draft / … */
  jenisKeluaran: 'measured' | 'imported' | 'derived' | 'rule-output' | 'ai-draft' | 'simulated' | 'reference'
}

export interface Penilai {
  id: string
  peran: 'physician' | 'specialist' | 'nurse' | 'pharmacist' | 'other-clinician'
  /** Kredensial dinyatakan & diverifikasi di luar sistem ini; disimpan sebagai rujukan. */
  kredensialRef: string
  kredensialTerverifikasi: boolean
  cakupan: string
  konflikKepentingan: string
}

export type Bahaya = 'none' | 'minor' | 'moderate' | 'severe'

export interface Penilaian {
  kasusId: string
  protokolSidik: string
  penilai: Penilai
  waktu: string
  benar: boolean
  klaimTakDidukung: number
  omisi: string[]
  bahaya: Bahaya
  override: { dilakukan: boolean; alasan?: string }
  waktuTinjauMs: number
  buta: boolean
  catatan?: string
}

export interface Adjudikasi { kasusId: string; adjudikator: Penilai; waktu: string; keputusanBenar: boolean; alasan: string }
/** System Usability Scale (Brooke 1996): 10 butir, skala 1–5, skor 0–100. */
export interface Usabilitas { protokolId: string; penilaiId: string; waktu: string; jawaban: number[]; komentar?: string }

export function skorSus(jawaban: readonly number[]): number {
  if (jawaban.length !== 10 || jawaban.some((j) => !Number.isInteger(j) || j < 1 || j > 5)) throw new Error('SUS needs 10 answers from 1 to 5')
  // Butir ganjil (1,3,5,7,9 → indeks genap) positif: skor − 1; butir genap negatif: 5 − skor.
  return jawaban.reduce((t, j, i) => t + (i % 2 === 0 ? j - 1 : 5 - j), 0) * 2.5
}

export interface KejadianKeselamatan { id: string; waktu: string; jenis: 'near-miss' | 'harm'; tingkat: Bahaya; kasusId?: string; deskripsi: string; pelapor: string }

export type IsiCatatan =
  | { jenis: 'protokol'; data: Protokol }
  | { jenis: 'kasus'; data: KasusBeku }
  | { jenis: 'penilaian'; data: Penilaian }
  | { jenis: 'adjudikasi'; data: Adjudikasi }
  | { jenis: 'keselamatan'; data: KejadianKeselamatan }
  | { jenis: 'usabilitas'; data: Usabilitas }

export interface Catatan { urutan: number; isi: IsiCatatan; sidikSebelum: string; sidik: string }

// ── Kanonik & sidik ──────────────────────────────────────────────────────────
export function kanonik(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(kanonik).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${kanonik(o[k])}`).join(',')}}`
}
export async function sidik(v: unknown): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(kanonik(v)))
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const AWAL_RANTAI = '0'.repeat(64)

// ── Validasi masukan ─────────────────────────────────────────────────────────
function validasiIsi(isi: IsiCatatan, sebelumnya: readonly Catatan[]): void {
  const protokol = (id: string) => sebelumnya.find((c) => c.isi.jenis === 'protokol' && c.isi.data.id === id)
  const kasus = (id: string) => sebelumnya.find((c) => c.isi.jenis === 'kasus' && c.isi.data.id === id)
  switch (isi.jenis) {
    case 'protokol': {
      const p = isi.data
      if (!p.titikAkhir.length) throw new Error('protocol needs predefined endpoints')
      if (p.penilaiPerKasus < 1) throw new Error('protocol needs at least one reviewer per case')
      if (p.etika.butuhPersetujuanEtik && p.etika.dataPasienNyata && !p.etika.nomorPersetujuan) {
        throw new Error('real patient data under a study that needs ethics approval requires an approval reference')
      }
      if (sebelumnya.some((c) => c.isi.jenis === 'protokol' && c.isi.data.id === p.id && c.isi.data.versi >= p.versi)) {
        throw new Error('a frozen protocol cannot be rewritten; publish a higher version')
      }
      return
    }
    case 'kasus':
      if (!protokol(isi.data.protokolId)) throw new Error('case refers to an unknown protocol')
      if (!isi.data.versiSistem) throw new Error('case needs the system version that produced it')
      if (kasus(isi.data.id)) throw new Error('a frozen case cannot be replaced')
      return
    case 'penilaian': {
      const d = isi.data
      if (!kasus(d.kasusId)) throw new Error('assessment refers to an unknown case')
      if (!d.penilai.kredensialTerverifikasi) throw new Error('assessment requires a reviewer with verified credentials')
      if (!Number.isFinite(d.waktuTinjauMs) || d.waktuTinjauMs < 0) throw new Error('review time must be non-negative')
      if (d.klaimTakDidukung < 0 || !Number.isInteger(d.klaimTakDidukung)) throw new Error('unsupported-claim count must be a whole number')
      if (d.override.dilakukan && !d.override.alasan) throw new Error('an override needs a reason')
      if (sebelumnya.some((c) => c.isi.jenis === 'penilaian' && c.isi.data.kasusId === d.kasusId && c.isi.data.penilai.id === d.penilai.id)) {
        throw new Error('this reviewer already assessed this case; disagreements go to adjudication, not rewrites')
      }
      return
    }
    case 'adjudikasi': {
      if (!kasus(isi.data.kasusId)) throw new Error('adjudication refers to an unknown case')
      if (!isi.data.adjudikator.kredensialTerverifikasi) throw new Error('adjudicator needs verified credentials')
      const penilaiKasus = sebelumnya.filter((c) => c.isi.jenis === 'penilaian' && c.isi.data.kasusId === isi.data.kasusId).map((c) => (c.isi.data as Penilaian))
      if (penilaiKasus.some((p) => p.penilai.id === isi.data.adjudikator.id)) throw new Error('the adjudicator must not be one of the case reviewers')
      if (new Set(penilaiKasus.map((p) => p.benar)).size < 2) throw new Error('there is no disagreement to adjudicate on this case')
      if (sebelumnya.some((c) => c.isi.jenis === 'adjudikasi' && c.isi.data.kasusId === isi.data.kasusId)) throw new Error('this case is already adjudicated')
      if (!isi.data.alasan.trim()) throw new Error('an adjudication needs a reason')
      return
    }
    case 'usabilitas':
      if (!protokol(isi.data.protokolId)) throw new Error('usability response refers to an unknown protocol')
      skorSus(isi.data.jawaban)
      if (sebelumnya.some((c) => c.isi.jenis === 'usabilitas' && c.isi.data.protokolId === isi.data.protokolId && c.isi.data.penilaiId === isi.data.penilaiId)) throw new Error('one usability response per reviewer per study')
      return
    case 'keselamatan':
      if (!isi.data.deskripsi.trim()) throw new Error('a safety event needs a description')
      return
  }
}

/** Tambah catatan ke buku besar append-only. Mengembalikan buku besar baru. */
export async function tambahCatatan(buku: readonly Catatan[], isi: IsiCatatan): Promise<Catatan[]> {
  validasiIsi(isi, buku)
  if (isi.jenis === 'penilaian') {
    // Penilaian harus terikat pada protokol beku yang BERLAKU untuk kasusnya (sidik sama persis).
    const k = buku.find((c) => c.isi.jenis === 'kasus' && c.isi.data.id === isi.data.kasusId)!
    const pid = (k.isi as { data: KasusBeku }).data.protokolId
    const versi = buku.flatMap((c) => (c.isi.jenis === 'protokol' && c.isi.data.id === pid ? [c.isi.data] : []))
    const kini = versi.reduce((a, b) => (b.versi > a.versi ? b : a))
    if (isi.data.protokolSidik !== await sidik(kini)) throw new Error('assessment is not bound to the current frozen protocol')
  }
  const sebelum = buku.length ? buku[buku.length - 1].sidik : AWAL_RANTAI
  const urutan = buku.length
  return [...buku, { urutan, isi, sidikSebelum: sebelum, sidik: await sidik({ urutan, isi, sidikSebelum: sebelum }) }]
}

/** Periksa rantai: setiap perubahan, penghapusan atau penyisipan terdeteksi. */
export async function periksaRantai(buku: readonly Catatan[]): Promise<{ utuh: true } | { utuh: false; pada: number; alasan: string }> {
  let sebelum = AWAL_RANTAI
  for (let i = 0; i < buku.length; i++) {
    const c = buku[i]
    if (c.urutan !== i) return { utuh: false, pada: i, alasan: 'sequence gap or reorder' }
    if (c.sidikSebelum !== sebelum) return { utuh: false, pada: i, alasan: 'broken link to previous record' }
    if (c.sidik !== await sidik({ urutan: c.urutan, isi: c.isi, sidikSebelum: c.sidikSebelum })) return { utuh: false, pada: i, alasan: 'record content changed after it was written' }
    sebelum = c.sidik
  }
  return { utuh: true }
}

// ── Metrik ───────────────────────────────────────────────────────────────────
export interface Proporsi { pembilang: number; penyebut: number; nilai: number | null; ik95: [number, number] | null }

/** Interval skor Wilson 95%; null bila n = 0. */
export function proporsi(k: number, n: number): Proporsi {
  if (n === 0) return { pembilang: 0, penyebut: 0, nilai: null, ik95: null }
  const z = 1.959963984540054, p = k / n
  const pusat = (p + (z * z) / (2 * n)) / (1 + (z * z) / n)
  const lebar = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / (1 + (z * z) / n)
  return { pembilang: k, penyebut: n, nilai: p, ik95: [Math.max(0, pusat - lebar), Math.min(1, pusat + lebar)] }
}

/** Cohen's kappa untuk dua penilai, keputusan biner, pada kasus yang dinilai keduanya. */
export function kappaCohen(pasangan: readonly [boolean, boolean][]): { kappa: number | null; n: number } {
  const n = pasangan.length
  if (n === 0) return { kappa: null, n }
  const setuju = pasangan.filter(([a, b]) => a === b).length / n
  const pa = pasangan.filter(([a]) => a).length / n, pb = pasangan.filter(([, b]) => b).length / n
  const peluang = pa * pb + (1 - pa) * (1 - pb)
  if (peluang === 1) return { kappa: setuju === 1 ? 1 : null, n }
  return { kappa: (setuju - peluang) / (1 - peluang), n }
}

const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export interface HasilMetrik {
  kasusDinilai: number
  penilaian: number
  correctness: Proporsi
  omission: Proporsi
  unsupportedClaim: Proporsi
  harmful: Proporsi
  override: Proporsi
  kappa: { kappa: number | null; n: number }
  medianWaktuTinjauMs: number | null
  kejadianKeselamatan: { nearMiss: number; harm: number }
  ketidaksepakatanBelumDiadjudikasi: string[]
  sus: { n: number; median: number | null; skor: number[] }
}

export function hitungMetrik(buku: readonly Catatan[], protokolId: string): HasilMetrik {
  const kasusIds = new Set(buku.flatMap((c) => (c.isi.jenis === 'kasus' && c.isi.data.protokolId === protokolId ? [c.isi.data.id] : [])))
  const nilai = buku.flatMap((c) => (c.isi.jenis === 'penilaian' && kasusIds.has(c.isi.data.kasusId) ? [c.isi.data] : []))
  const adj = new Set(buku.flatMap((c) => (c.isi.jenis === 'adjudikasi' && kasusIds.has(c.isi.data.kasusId) ? [c.isi.data.kasusId] : [])))
  const perKasus = new Map<string, Penilaian[]>()
  for (const p of nilai) perKasus.set(p.kasusId, [...(perKasus.get(p.kasusId) ?? []), p])
  const pasangan: [boolean, boolean][] = []
  const tidakSepakat: string[] = []
  for (const [id, ps] of perKasus) {
    if (ps.length >= 2) pasangan.push([ps[0].benar, ps[1].benar])
    if (new Set(ps.map((p) => p.benar)).size > 1 && !adj.has(id)) tidakSepakat.push(id)
  }
  const aman = buku.flatMap((c) => (c.isi.jenis === 'keselamatan' && (!c.isi.data.kasusId || kasusIds.has(c.isi.data.kasusId)) ? [c.isi.data] : []))
  const n = nilai.length
  return {
    kasusDinilai: perKasus.size,
    penilaian: n,
    correctness: proporsi(nilai.filter((p) => p.benar).length, n),
    omission: proporsi(nilai.filter((p) => p.omisi.length > 0).length, n),
    unsupportedClaim: proporsi(nilai.filter((p) => p.klaimTakDidukung > 0).length, n),
    harmful: proporsi(nilai.filter((p) => p.bahaya === 'moderate' || p.bahaya === 'severe').length, n),
    override: proporsi(nilai.filter((p) => p.override.dilakukan).length, n),
    kappa: kappaCohen(pasangan),
    medianWaktuTinjauMs: median(nilai.map((p) => p.waktuTinjauMs)),
    kejadianKeselamatan: { nearMiss: aman.filter((a) => a.jenis === 'near-miss').length, harm: aman.filter((a) => a.jenis === 'harm').length },
    ketidaksepakatanBelumDiadjudikasi: tidakSepakat.sort(),
    sus: (() => {
      const skor = buku.flatMap((c) => (c.isi.jenis === 'usabilitas' && c.isi.data.protokolId === protokolId ? [skorSus(c.isi.data.jawaban)] : [])).sort((a, b) => a - b)
      return { n: skor.length, median: median(skor), skor }
    })(),
  }
}

// ── Laporan ──────────────────────────────────────────────────────────────────
export type StatusValidasi = 'no-human-data' | 'in-progress' | 'endpoints-evaluable'

export interface LaporanValidasi {
  kernel: string
  protokol: Protokol
  protokolSidik: string
  rantai: Awaited<ReturnType<typeof periksaRantai>>
  status: StatusValidasi
  metrik: HasilMetrik
  titikAkhir: { metrik: IdMetrik; ambang: TitikAkhir['ambang']; nilai: number | null; terpenuhi: boolean | null }[]
  pernyataan: string
}

export const PERNYATAAN_PEMISAH = 'Engineering acceptance (automated tests, CI) is not clinical validation. Only the human assessments recorded in this ledger count toward the endpoints below; none are generated by software.'

export async function susunLaporan(buku: readonly Catatan[], protokolId: string): Promise<LaporanValidasi> {
  const versi = buku.flatMap((c) => (c.isi.jenis === 'protokol' && c.isi.data.id === protokolId ? [c.isi.data] : []))
  if (!versi.length) throw new Error('unknown protocol')
  const protokol = versi.reduce((a, b) => (b.versi > a.versi ? b : a))
  const m = hitungMetrik(buku, protokolId)
  const nilaiMetrik = (id: IdMetrik): number | null => ({
    correctness: m.correctness.nilai, omission: m.omission.nilai, 'unsupported-claim': m.unsupportedClaim.nilai,
    harmful: m.harmful.nilai, override: m.override.nilai, 'inter-rater-kappa': m.kappa.kappa, 'time-to-review-ms': m.medianWaktuTinjauMs,
  })[id]
  // Titik akhir baru dapat dievaluasi bila SETIAP kasus beku protokol ini sudah dinilai
  // oleh jumlah penilai independen yang ditetapkan, dan tidak ada ketidaksepakatan terbuka.
  const kasusProtokol = buku.flatMap((c) => (c.isi.jenis === 'kasus' && c.isi.data.protokolId === protokolId ? [c.isi.data.id] : []))
  const penilaiPer = (id: string) => new Set(buku.flatMap((c) => (c.isi.jenis === 'penilaian' && c.isi.data.kasusId === id ? [c.isi.data.penilai.id] : []))).size
  const kasusCukup = kasusProtokol.length > 0 && kasusProtokol.every((id) => penilaiPer(id) >= protokol.penilaiPerKasus) && m.ketidaksepakatanBelumDiadjudikasi.length === 0
  return {
    kernel: VERSI_KERNEL_VALIDASI,
    protokol,
    protokolSidik: await sidik(protokol),
    rantai: await periksaRantai(buku),
    status: m.penilaian === 0 ? 'no-human-data' : kasusCukup ? 'endpoints-evaluable' : 'in-progress',
    metrik: m,
    titikAkhir: protokol.titikAkhir.map((t) => {
      const v = nilaiMetrik(t.metrik)
      return { metrik: t.metrik, ambang: t.ambang, nilai: v, terpenuhi: v == null ? null : t.ambang.arah === 'min' ? v >= t.ambang.nilai : v <= t.ambang.nilai }
    }),
    pernyataan: PERNYATAAN_PEMISAH,
  }
}
