// Masukan Body Composition: angka bawaan hanya menjaga rumus tetap terdefinisi, TIDAK PERNAH dianggap
// data pengguna. Sebuah kolom "diisi" hanya bila pengguna mengetiknya, profil bersama memilikinya, atau
// perangkat menyinkronkannya. Hanya kolom yang diisi yang disimpan, dibagikan, atau dipakai untuk hasil.

export interface Body {
  w: number; h: number; age: number; g: 'M' | 'F'
  waist: number; hip: number; neck: number
  smm: number; bfm: number // opsional dari InBody (0 = tidak ada)
  rhr: number; hrv: number; sleepH: number; remH: number; deepH: number
  stress: number; anxiety: number; mood: number // laporan diri 0-10
  mets: number; caffeineCutoff: string; noiseDb: number
  vo2: number
  bmd: number // T-score kepadatan tulang (DEXA); 0 = tidak ada
}
export type KunciBody = keyof Body

export const DEF: Body = {
  w: 70, h: 170, age: 30, g: 'M', waist: 85, hip: 98, neck: 38,
  smm: 0, bfm: 0, rhr: 65, hrv: 0, sleepH: 7, remH: 1.5, deepH: 1.2,
  stress: 4, anxiety: 3, mood: 7, mets: 6, caffeineCutoff: '14:00', noiseDb: 45, vo2: 0,
  bmd: 0,
}
export const VERSI_SIMPAN = 2

const KUNCI = Object.keys(DEF) as KunciBody[]
/** Kolom yang harus > 0 agar dianggap diisi (0 di kolom ini berarti kosong, bukan pengukuran). */
const HARUS_POSITIF: ReadonlySet<KunciBody> = new Set(['w', 'h', 'age', 'waist', 'hip', 'neck', 'smm', 'bfm', 'rhr', 'hrv', 'sleepH', 'vo2'])
const JAM = /^([01]\d|2[0-3]):[0-5]\d$/

export const LABEL: Record<KunciBody, string> = {
  w: 'weight', h: 'height', age: 'age', g: 'sex', waist: 'waist', hip: 'hip', neck: 'neck',
  smm: 'skeletal muscle mass', bfm: 'fat mass', rhr: 'resting heart rate', hrv: 'HRV', sleepH: 'total sleep',
  remH: 'REM sleep', deepH: 'deep sleep', stress: 'stress', anxiety: 'anxiety', mood: 'mood', mets: 'exercise METs',
  caffeineCutoff: 'caffeine cut-off', noiseDb: 'noise', vo2: 'VO₂max', bmd: 'bone density',
}

/** Apakah `nilai` sah sebagai isian pengguna untuk kolom `kunci`? */
export function sahDiisi(kunci: KunciBody, nilai: unknown): boolean {
  if (kunci === 'g') return nilai === 'M' || nilai === 'F'
  if (kunci === 'caffeineCutoff') return typeof nilai === 'string' && JAM.test(nilai)
  if (typeof nilai !== 'number' || !Number.isFinite(nilai)) return false
  if (kunci === 'bmd') return nilai !== 0
  return HARUS_POSITIF.has(kunci) ? nilai > 0 : nilai >= 0
}

export interface KeadaanMasukan { b: Body; diisi: ReadonlySet<KunciBody> }

/**
 * Baca isi simpanan. Format baru (`_v: 2`) hanya memuat kolom yang diisi. Format lama memuat SEMUA kolom
 * (termasuk angka bawaan yang tak pernah diketik siapa pun); di sana hanya nilai yang berbeda dari angka
 * bawaan yang dipercaya sebagai isian. Data rusak atau asing diabaikan tanpa melempar.
 */
export function bacaTersimpan(mentah: unknown): KeadaanMasukan {
  const b: Body = { ...DEF }
  const diisi = new Set<KunciBody>()
  if (!mentah || typeof mentah !== 'object' || Array.isArray(mentah)) return { b, diisi }
  const sumber = mentah as Record<string, unknown>
  const baru = sumber._v === VERSI_SIMPAN
  for (const k of KUNCI) {
    if (!Object.prototype.hasOwnProperty.call(sumber, k)) continue
    const v = sumber[k]
    if (!sahDiisi(k, v)) continue
    if (!baru && v === DEF[k]) continue
    ;(b as unknown as Record<string, unknown>)[k] = v
    diisi.add(k)
  }
  return { b, diisi }
}

/** Terapkan perubahan: nilai sah menandai kolom diisi; `undefined`/tak sah mengosongkannya (kembali ke bawaan). */
export function terapkan(cur: KeadaanMasukan, patch: Partial<Record<KunciBody, unknown>>): KeadaanMasukan {
  const b: Body = { ...cur.b }
  const diisi = new Set(cur.diisi)
  for (const k of Object.keys(patch) as KunciBody[]) {
    if (!KUNCI.includes(k)) continue
    const v = patch[k]
    if (sahDiisi(k, v)) { ;(b as unknown as Record<string, unknown>)[k] = v; diisi.add(k) }
    else { ;(b as unknown as Record<string, unknown>)[k] = DEF[k]; diisi.delete(k) }
  }
  return { b, diisi }
}

/** Isi simpanan: hanya kolom yang diisi, ditandai versi agar format lama dapat dibedakan. */
export function serialisasi(s: KeadaanMasukan): Record<string, unknown> {
  const out: Record<string, unknown> = { _v: VERSI_SIMPAN }
  for (const k of KUNCI) if (s.diisi.has(k)) out[k] = s.b[k]
  return out
}

/** Nilai yang boleh dibagikan ke Profil Kesehatan bersama: hanya yang benar-benar diisi. */
export function biometrikUntukDibagikan(s: KeadaanMasukan): { vo2max?: number; restingHr?: number; hrvMs?: number; sleepH?: number; weightKg?: number } {
  const out: { vo2max?: number; restingHr?: number; hrvMs?: number; sleepH?: number; weightKg?: number } = {}
  if (s.diisi.has('vo2')) out.vo2max = s.b.vo2
  if (s.diisi.has('rhr')) out.restingHr = s.b.rhr
  if (s.diisi.has('hrv')) out.hrvMs = s.b.hrv
  if (s.diisi.has('sleepH')) out.sleepH = s.b.sleepH
  if (s.diisi.has('w')) out.weightKg = s.b.w
  return out
}

/** Nama kolom (bahasa Inggris, untuk antarmuka) yang belum diisi dari `perlu`. */
export function yangKurang(diisi: ReadonlySet<KunciBody>, perlu: readonly KunciBody[]): string[] {
  return perlu.filter((k) => !diisi.has(k)).map((k) => LABEL[k])
}

/**
 * Skor komposisi, tipe tubuh dan analisis otot-lemak butuh berat, tinggi, usia, jenis kelamin, ditambah satu
 * sumber lemak: massa lemak InBody, ATAU lingkar pinggang dan leher (dan pinggul untuk perempuan, rumus U.S. Navy).
 */
export function kurangKomposisi(s: KeadaanMasukan): string[] {
  const dasar = yangKurang(s.diisi, ['w', 'h', 'age', 'g'])
  if (s.diisi.has('bfm')) return dasar
  const perluLemak: KunciBody[] = ['waist', 'neck']
  if (s.diisi.has('g') && s.b.g === 'F') perluLemak.push('hip')
  return [...dasar, ...yangKurang(s.diisi, perluLemak)]
}

/** Kolom yang dibutuhkan tiap ubin penanda harian; ubin tanpa semua kolomnya tidak menampilkan angka. */
export const PERLU_UBIN: Record<string, readonly KunciBody[]> = {
  readiness: ['sleepH', 'remH', 'deepH', 'stress', 'rhr', 'hrv'],
  battery: ['sleepH', 'stress', 'rhr', 'hrv'],
  cardio: ['vo2'],
  restingHr: ['rhr'],
  restorative: ['sleepH', 'remH', 'deepH'],
  aging: ['vo2', 'stress', 'sleepH'],
  lifeExpectancy: ['vo2', 'sleepH', 'stress', 'waist', 'hip'],
  effort: ['mets'],
  noise: ['noiseDb'],
  mental: ['stress', 'anxiety', 'mood'],
}
