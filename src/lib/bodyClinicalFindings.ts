import type { BodyClinicalSystemFinding } from './bodyClinicalBridge'

const BODY_SYSTEMS: readonly {
  key: string
  label: string
  x: number
  y: number
  keywords: readonly string[]
}[] = [
  { key: 'mata', label: 'Eyes', x: 60, y: 9, keywords: ['mata', 'pupil', 'konjungtiva', 'sklera', 'visus', 'vod', 'vos'] },
  { key: 'tht', label: 'ENT', x: 38, y: 10, keywords: ['telinga', 'hidung', 'tenggorok', 'faring', 'tonsil', 'mukosa', 'nasofaring'] },
  { key: 'kepala', label: 'Head', x: 50, y: 5, keywords: ['kepala', 'normosefali', 'wajah', 'facies'] },
  { key: 'leher', label: 'Neck', x: 50, y: 17, keywords: ['leher', 'kgb', 'trakea', 'tiroid', 'jvp'] },
  { key: 'paru', label: 'Lungs', x: 37, y: 32, keywords: ['paru', 'vesikuler', 'ronki', 'rhonki', 'wheezing', 'fremitus', 'sonor'] },
  { key: 'jantung', label: 'Heart', x: 61, y: 34, keywords: ['jantung', 'cardio', 'iktus', 'ictus', 's1s2', 'murmur', 'gallop'] },
  { key: 'abdomen', label: 'Abdomen', x: 50, y: 47, keywords: ['abdomen', 'bising usus', 'hepatomegali', 'splenomegali', 'nyeri tekan', 'supel'] },
  { key: 'kulit', label: 'Skin', x: 28, y: 58, keywords: ['kulit', 'spider nevi', 'eritema', 'pucat', 'sianosis'] },
  { key: 'ekstremitas', label: 'Extremities', x: 72, y: 82, keywords: ['ekstremitas', 'akral', 'crt', 'edema'] },
] as const

const ABNORMAL_HINTS = [
  '(+)',
  'menurun',
  'prolaps',
  'massa',
  'pembesaran',
  'deviasi',
  'ikterik',
  'edema (+)',
  'anemis (+)',
  'ronki (+',
  'wheezing (+',
  'murmur (+',
  'asites',
] as const

// Istilah temuan abnormal. Muncul TANPA negasi -> 'abnormal' ("finding recorded").
const ISTILAH_ABNORMAL = [
  'murmur', 'gallop', 'ronki', 'rhonki', 'wheezing', 'edema', 'massa', 'nyeri', 'pembesaran', 'hepatomegali',
  'splenomegali', 'ikterik', 'anemis', 'sianosis', 'pucat', 'eritema', 'asites', 'deviasi', 'menurun', 'prolaps', 'spider nevi',
] as const
// Penanda normal eksplisit. Tanpa salah satunya, baris yang tidak abnormal TIDAK
// dianggap normal — ia 'recorded' (tercatat, tidak diklasifikasi).
const PENANDA_NORMAL = ['normal', 'dbn', '(-)', '-/-', 'tidak ada', 'tidak ditemukan', 'tanpa', 'reguler', 'vesikuler', 'supel', 'normosefali', 'simetris', 'tunggal', 'sonor', 'jernih', 'baik'] as const
const NEGASI_SEBELUM = ['tidak ada ', 'tidak ditemukan ', 'tanpa ', 'tidak ', 'no ']

function istilahTerNegasi(teks: string, i: number, istilah: string): boolean {
  const sebelum = teks.slice(Math.max(0, i - 18), i)
  const sesudah = teks.slice(i + istilah.length, i + istilah.length + 8)
  return NEGASI_SEBELUM.some((n) => sebelum.endsWith(n)) || /^\s*(\(-\)|-\/-|negatif)/.test(sesudah)
}

/**
 * Klasifikasi konservatif catatan pemeriksaan per sistem (teks bebas).
 * - 'abnormal': petunjuk (+) eksplisit, atau istilah abnormal tanpa negasi
 *   (mis. "murmur sistolik 2/6" — dulu keliru dianggap normal);
 * - 'normal': hanya bila ada penanda normal eksplisit dan tidak ada yang abnormal;
 * - 'recorded': tercatat tetapi tidak dapat diklasifikasi — tidak diklaim normal.
 * Heuristik navigasi saja; bukan interpretasi klinis.
 */
export function klasifikasiTemuan(catatan: string): 'normal' | 'abnormal' | 'recorded' {
  const t = catatan.toLowerCase()
  if (ABNORMAL_HINTS.some((h) => t.includes(h))) return 'abnormal'
  for (const istilah of ISTILAH_ABNORMAL) {
    let i = t.indexOf(istilah)
    while (i >= 0) {
      if (!istilahTerNegasi(t, i, istilah)) return 'abnormal'
      i = t.indexOf(istilah, i + istilah.length)
    }
  }
  return PENANDA_NORMAL.some((n) => t.includes(n)) ? 'normal' : 'recorded'
}

// Rekam medis dari server bisa belum memuat pemeriksaan per sistem. Dulu
// `undefined.split` merobohkan seluruh halaman Clinical untuk setiap dokter pada
// deployment yang tersambung ke backend; sekarang dianggap "belum ada temuan".
export function buildBodyClinicalFindings(perSystem: string | null | undefined): BodyClinicalSystemFinding[] {
  const lines = (typeof perSystem === 'string' ? perSystem : '').split('\n').map((line) => line.trim()).filter(Boolean)

  return BODY_SYSTEMS.map((system) => {
    const matched = lines.filter((line) => {
      const lower = line.toLowerCase()
      return system.keywords.some((keyword) => lower.includes(keyword))
    })

    if (matched.length === 0) {
      return { key: system.key, label: system.label, x: system.x, y: system.y, status: 'unchecked' }
    }

    const note = matched.join(' ')
    const lower = note.toLowerCase()
    const abnormal = ABNORMAL_HINTS.some((hint) => lower.includes(hint))

    return {
      key: system.key,
      label: system.label,
      x: system.x,
      y: system.y,
      status: klasifikasiTemuan(note),
      note,
    }
  })
}
