import type { Vitals } from './healthVitals'
import { allowsPersonalHealthStorageScope, type PersonalHealthStorageScope } from '../shared/kernel/personalHealthStorageScope.ts'
import { readPersonalHealthStorageScope } from '../domains/personal-health/index.ts'
import { RANGE_MIN_DAYS, RANGE_SPAN_DAYS, personalRange, rangePosition } from '../domains/personal-health/engine/glance/metricInsight.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Riwayat angka tubuh, dan rentang kebiasaan Anda sendiri.
//
// CACAT YANG DITEMUKAN SAAT MENGEVALUASI. Aplikasi ini menyimpan 113 medan
// metrik, tetapi menyimpannya sebagai SATU POTRET: setiap kali data baru masuk,
// nilai kemarin ditimpa dan hilang selamanya. Akibatnya tidak ada satu pun
// angka tubuh yang punya riwayat — grafik kecil pada ubin beranda hanya dapat
// digambar untuk tidur dan makanan, yang kebetulan disimpan per tanggal.
//
// Itu bukan kekurangan tampilan melainkan kekurangan DATA, dan tidak ada
// susunan warna atau tata letak yang dapat menutupinya.
//
// MENGAPA RIWAYAT ITU YANG PALING MENENTUKAN. Gagasan terbaik dari aplikasi
// yang menjadi rujukan bukan warnanya, melainkan RENTANG PRIBADI: alih-alih
// menyatakan sebuah angka baik atau buruk menurut populasi, ia menyatakan
// apakah angka itu biasa BAGI ANDA, dengan menyebut kebiasaan Anda sendiri
// secara terbuka — "HRV Anda 35,7 ms; dalam 90 hari terakhir kebiasaan Anda
// 39,5 sampai 68,0 ms".
//
// Pernyataan semacam itu jujur dengan cara yang tidak dimiliki penilaian
// populasi. Denyut istirahat 58 bpm tidak dapat disebut baik atau buruk tanpa
// tahu siapa orangnya; tetapi 58 bpm pada orang yang selama tiga bulan berada
// di 46-52 bpm adalah SESUATU YANG BERUBAH, dan perubahan itu fakta, bukan
// tafsiran. Pembandingnya adalah dirinya sendiri, dan pembanding itu disebutkan
// apa adanya sehingga dapat diperiksa.
//
// YANG TETAP TIDAK DILAKUKAN. Rentang pribadi TIDAK menggantikan rentang
// rujukan medis dan tidak dipakai untuk menyatakan sehat atau sakit. Seseorang
// yang saturasinya tiga bulan terakhir 88-90% akan mendapati 89% sebagai
// "biasa bagi Anda", padahal justru itu yang harus diperiksakan. Karena itu
// kalimatnya selalu berbentuk "dibanding kebiasaan Anda", bukan "normal", dan
// halaman rentang rujukan tetap menjadi tempat penilaian medisnya.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_riwayat_vitals_v1'
const MAKS_HARI = 180

/** Satu hari: bacaan yang tiba pada hari itu, nilai terakhir per sinyal. Sinyal yang tidak tiba hari itu tidak ada di baris ini. */
export interface HariVitals {
  tanggal: string
  nilai: Record<string, number>
}

// Widget Home meminta banyak deret/rentang dari riwayat yang sama. Tanpa cache,
// setiap deretMetrik() mem-parse ulang JSON sampai 180 hari, sehingga HRV,
// langkah, tidur, VO2max, berat, tekanan dan metrik lain saling menumpuk pada
// main thread. String localStorage tetap menjadi sumber kebenaran: bila berubah
// (termasuk dari tab lain), cache otomatis tidak cocok dan diparse ulang.
let cachedRaw: string | null | undefined
let cachedHistory: HariVitals[] | undefined
let cachedKey: string | undefined

function historyKey(scope: PersonalHealthStorageScope): string {
  return `pmd_riwayat_vitals_scope_v1:${scope.kind === 'account' ? scope.token : 'anonymous'}`
}

function matchesHistoryOwner(v: { ownerAccountId?: string; subjectId?: string }, scope: PersonalHealthStorageScope): boolean {
  if (scope.kind === 'invalid') return false
  return scope.kind === 'account'
    ? v.ownerAccountId === scope.accountId && v.subjectId === scope.subjectId
    : v.ownerAccountId === undefined && v.subjectId === undefined
}

function serializeHistory(history: HariVitals[], scope: PersonalHealthStorageScope): string {
  return JSON.stringify({ version: 1, history,
    ownerAccountId: scope.kind === 'account' ? scope.accountId : undefined,
    subjectId: scope.kind === 'account' ? scope.subjectId : undefined,
  })
}

function kunciTanggalLokal(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function ambilRiwayat(): HariVitals[] {
  try {
    const scope = readPersonalHealthStorageScope()
    if (scope.kind === 'invalid' || !allowsPersonalHealthStorageScope(scope)) return []
    const key = historyKey(scope)
    const scopedRaw = localStorage.getItem(key)
    // Unowned legacy history stays available anonymously, never adopted at sign-in.
    const raw = scopedRaw ?? (scope.kind === 'anonymous' ? localStorage.getItem(KUNCI) : null)
    if (key === cachedKey && raw === cachedRaw && cachedHistory) return cachedHistory.slice()

    const value = raw ? JSON.parse(raw) : null
    const arr = scopedRaw !== null
      ? value && value.version === 1 && matchesHistoryOwner(value, scope) ? value.history : []
      : scope.kind === 'anonymous' ? value : []
    const parsed = Array.isArray(arr) ? arr.filter((h) => h && typeof h.tanggal === 'string' && h.nilai) : []
    cachedKey = key
    cachedRaw = raw
    cachedHistory = parsed
    return parsed.slice()
  } catch {
    cachedRaw = undefined
    cachedHistory = undefined
    return []
  }
}

/**
 * Catat bacaan yang baru tiba ke baris hari ini.
 *
 * `v` adalah nilai yang tiba pada satu penyaluran, BUKAN potret gabungan:
 * potret gabungan membawa nilai terakhir setiap sinyal, sehingga pada hari
 * yang hanya menyalurkan sebagian sinyal, sinyal lain tercatat ulang seolah
 * diukur lagi (satu bacaan tekanan darah menjadi "14 bacaan terakhir", rentang
 * pribadi menyempit oleh salinan). Bacaan hari ini yang sudah ada tetap ada;
 * sinyal yang sama diganti oleh nilai yang lebih baru.
 *
 * SATU BARIS PER HARI, bukan satu baris per penyaluran data. Jam tangan
 * menyalurkan data berkali-kali sehari, dan menyimpan tiap penyaluran akan
 * membuat sebuah hari yang kebetulan disinkronkan dua puluh kali menguasai
 * perhitungan rentang, seolah hari itu dua puluh kali lebih penting daripada
 * hari lain.
 *
 * Dipanggil dari mergeVitals, sehingga tidak ada jalan masuk data yang lolos
 * tanpa tercatat.
 */
export function catatRiwayat(v: Vitals): void {
  const scope = readPersonalHealthStorageScope()
  // The deferred mergeVitals callback carries its original owner, not the new session.
  if (!allowsPersonalHealthStorageScope(scope) || !matchesHistoryOwner(v, scope)) return
  const angka = angkaPositif(v)
  if (!Object.keys(angka).length) return
  tulisBaris(scope, [{ tanggal: kunciTanggalLokal(), nilai: angka }])
}

/** Hanya angka hingga dan positif; selain itu bukan bacaan. */
function angkaPositif(v: Readonly<Record<string, unknown>>): Record<string, number> {
  const angka: Record<string, number> = {}
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) angka[k] = val
  }
  return angka
}

/**
 * Menggabungkan baris-baris bertanggal ke riwayat pemilik `scope`: untuk setiap tanggal, sinyal yang dibawa baris
 * menimpa sinyal yang sama pada hari itu, sinyal lain hari itu tetap. Satu jalur tulis untuk bacaan hari ini dan
 * untuk riwayat yang diimpor.
 */
function tulisBaris(scope: PersonalHealthStorageScope, baris: readonly HariVitals[]): void {
  const key = historyKey(scope)
  const perTanggal = new Map(ambilRiwayat().map((h) => [h.tanggal, h]))
  for (const b of baris) {
    const lama = perTanggal.get(b.tanggal)
    perTanggal.set(b.tanggal, { tanggal: b.tanggal, nilai: { ...(lama?.nilai ?? {}), ...b.nilai } })
  }
  const riwayat = [...perTanggal.values()].sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))

  const penuh = riwayat.slice(-MAKS_HARI)
  try {
    const raw = serializeHistory(penuh, scope)
    localStorage.setItem(key, raw)
    cachedKey = key
    cachedRaw = raw
    cachedHistory = penuh
  } catch {
    // Kuota penuh: buang separuh tertua lalu coba sekali lagi. Gagal menyimpan
    // riwayat tidak boleh menggagalkan penyimpanan angka hari ini.
    try {
      const ringkas = riwayat.slice(-Math.floor(MAKS_HARI / 2))
      const raw = serializeHistory(ringkas, scope)
      localStorage.setItem(key, raw)
      cachedKey = key
      cachedRaw = raw
      cachedHistory = ringkas
    } catch { /* menyerah, tanpa mengganggu apa pun */ }
  }
}

/**
 * Riwayat yang tiba BERTANGGAL — mis. ekspor Health Auto Export 90 hari. Sebelumnya hanya nilai terakhir file yang
 * dicatat, dan dicatat sebagai hari ini: ekspor tiga bulan memberi penganalisis satu hari. Setiap hari kini masuk ke
 * tanggalnya sendiri. Tanggal yang bukan YYYY-MM-DD, hari di masa depan, atau baris tanpa angka positif dilewati.
 * Mengembalikan jumlah hari yang dicatat (0 bila sesi bukan milik siapa pun yang boleh menulis).
 */
export function catatRiwayatHarian(hari: ReadonlyArray<{ readonly date: string; readonly values: Readonly<Record<string, number>> }>, today: string = kunciTanggalLokal()): number {
  const scope = readPersonalHealthStorageScope()
  if (!allowsPersonalHealthStorageScope(scope) || scope.kind === 'invalid') return 0
  const baris: HariVitals[] = []
  for (const h of hari ?? []) {
    if (typeof h?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(h.date) || h.date > today) continue
    const angka = angkaPositif(h.values ?? {})
    if (Object.keys(angka).length) baris.push({ tanggal: h.date, nilai: angka })
  }
  if (baris.length) tulisBaris(scope, baris)
  return baris.length
}

/** Deret nilai satu metrik, terlama di depan. */
export function deretMetrik(kunci: string, maksHari = MAKS_HARI): { tanggal: string; nilai: number }[] {
  return ambilRiwayat()
    .slice(-maksHari)
    .filter((h) => typeof h.nilai[kunci] === 'number')
    .map((h) => ({ tanggal: h.tanggal, nilai: h.nilai[kunci] }))
}

/** Jumlah hari terkecil sebelum sebuah rentang pribadi boleh disebut. */
export const CUKUP_HARI = RANGE_MIN_DAYS

export interface RentangPribadi {
  bawah: number
  atas: number
  /** Berapa hari yang menjadi dasarnya. */
  hari: number
  /** Nilai terakhir dibanding rentangnya. */
  posisi: 'below your usual' | 'within your usual' | 'above your usual'
}

/**
 * Rentang kebiasaan pribadi untuk satu metrik.
 *
 * Memakai PERSENTIL 10 dan 90, bukan nilai terkecil dan terbesar. Satu hari
 * yang aneh — jam tangan terlepas, demam sehari, alat salah baca — akan
 * melebarkan rentang minimum-maksimum sedemikian rupa sehingga tidak ada nilai
 * yang pernah terbaca di luar kebiasaan, dan rentang yang tidak pernah
 * dilanggar tidak memberi tahu apa pun.
 *
 * Mengembalikan null bila harinya kurang dari CUKUP_HARI. Rentang yang disusun
 * dari lima hari lebih menyesatkan daripada tidak ada rentang sama sekali.
 */
export function rentangPribadi(kunci: string, nilaiKini?: number): RentangPribadi | null {
  // Satu aturan rentang untuk seluruh aplikasi (domains/personal-health/engine/glance/metricInsight): kalimat
  // "kebiasaan Anda" di sini dan lembar wawasan Home tidak boleh menyebut angka berbeda untuk data yang sama.
  const deret = deretMetrik(kunci, RANGE_SPAN_DAYS).map((d) => d.nilai)
  const r = personalRange(deret)
  if (!r) return null
  const kini = typeof nilaiKini === 'number' ? nilaiKini : deret[deret.length - 1]
  const posisi = rangePosition(r, kini)
  return { bawah: r.low, atas: r.high, hari: r.days, posisi: `${posisi} your usual` }
}

/**
 * Kalimat yang menemani rentang itu.
 *
 * Selalu menyebut ANGKANYA, bukan hanya kesimpulannya. "Di luar kebiasaan"
 * tanpa menyebut kebiasaannya berapa adalah penilaian yang tidak dapat
 * diperiksa pembacanya — dan penilaian yang tidak dapat diperiksa persis yang
 * dihindari seluruh aplikasi ini.
 */
export function bacaRentang(r: RentangPribadi, satuan: string, bulat = 0): string {
  const f = (n: number) => (bulat ? n.toFixed(bulat) : String(Math.round(n)))
  return `${r.posisi}: ${f(r.bawah)}-${f(r.atas)} ${satuan} over the last ${r.hari} days`
}
