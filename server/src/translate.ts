// ─────────────────────────────────────────────────────────────────────────────
// PENERJEMAH — bahasa antar-manusia, bukan penukar kata.
//
// KENAPA INI BISA LEBIH BAIK DARIPADA PENERJEMAH MESIN UMUM, dan di mana
// batasnya. Model bahasa menerjemahkan dengan KONTEKS: ia membaca seluruh
// paragraf sebelum memilih kata, mengenali daftar istilah yang diberikan
// kepadanya, dan bisa diberi tahu siapa pembacanya. Penerjemah statistik
// menerjemahkan kalimat demi kalimat tanpa tahu itu teks kedokteran.
//
// Tapi keunggulan itu saja TIDAK CUKUP, dan justru berbahaya kalau berhenti di
// situ. Model bahasa sesekali "memperbaiki" hal yang tidak boleh disentuh:
// mengubah 5 mg jadi 5 mL, menerjemahkan nama dagang obat jadi kata benda
// biasa, atau meng-Indonesia-kan kode ICD. Pada aplikasi kedokteran itu bukan
// cacat gaya bahasa, itu cacat KESELAMATAN.
//
// Karena itu penerjemah ini bekerja dua lapis:
//
//   1. PERISAI DETERMINISTIK. Sebelum teks dikirim ke model, semua yang tidak
//      boleh berubah — angka berikut satuannya, dosis, kode ICD/ATC/LOINC,
//      istilah Terminologia Anatomica, URL, dan nama zat aktif — DICABUT dan
//      diganti penanda ⟦0⟧, ⟦1⟧, dan seterusnya. Model tidak pernah melihatnya,
//      jadi tidak mungkin mengubahnya. Sesudah terjemahan kembali, penandanya
//      diisi ulang persis seperti semula, dan kalau ada satu penanda saja yang
//      hilang, terjemahannya DITOLAK, bukan diterbitkan apa adanya.
//
//   2. MODEL BAHASA untuk sisanya — kalimatnya, nadanya, dan istilah klinis
//      yang memang punya padanan resmi di bahasa sasaran.
//
// Perisai itulah yang tidak dimiliki penerjemah umum, dan itulah alasan sebenarnya
// terjemahan ini lebih aman untuk teks kedokteran — bukan karena modelnya lebih
// pintar, melainkan karena ada hal-hal yang sengaja tidak diserahkan kepadanya.
// ─────────────────────────────────────────────────────────────────────────────

export interface Bahasa { kode: string; nama: string; asli: string }

// Bahasa dasar aplikasi (English) plus enam bahasa yang memang ditargetkan,
// ditambah bahasa yang korpus organnya sudah tersedia.
export const BAHASA: Bahasa[] = [
  { kode: 'en', nama: 'English', asli: 'English' },
  { kode: 'id', nama: 'Indonesian', asli: 'Bahasa Indonesia' },
  { kode: 'ar', nama: 'Arabic', asli: 'العربية' },
  { kode: 'zh', nama: 'Mandarin Chinese', asli: '中文' },
  { kode: 'fr', nama: 'French', asli: 'Français' },
  { kode: 'ja', nama: 'Japanese', asli: '日本語' },
  { kode: 'nl', nama: 'Dutch', asli: 'Nederlands' },
  { kode: 'de', nama: 'German', asli: 'Deutsch' },
  { kode: 'es', nama: 'Spanish', asli: 'Español' },
  { kode: 'hi', nama: 'Hindi', asli: 'हिन्दी' },
  { kode: 'ko', nama: 'Korean', asli: '한국어' },
  { kode: 'pt', nama: 'Portuguese', asli: 'Português' },
  { kode: 'ru', nama: 'Russian', asli: 'Русский' },
]

/** Untuk siapa terjemahannya. Menentukan register, bukan isi. */
export type Register = 'pasien' | 'klinis' | 'akademik'

export const REGISTER: Array<{ key: Register; label: string; arahan: string }> = [
  {
    key: 'pasien',
    label: 'For the patient',
    arahan:
      'Write for a worried adult with no medical training. Prefer everyday words over technical ones. When a technical term cannot be avoided, give it and then explain it in the same sentence. Never sound colder than the source; a patient reading this is often frightened.',
  },
  {
    key: 'klinis',
    label: 'For clinicians',
    arahan:
      'Write as a clinician writes to another clinician in this language. Use the standard clinical vocabulary of the target country, including its usual abbreviations. Keep it terse. Do not explain terms a clinician already knows.',
  },
  {
    key: 'akademik',
    label: 'Academic',
    arahan:
      'Write in formal academic register suitable for a journal or a textbook in the target language. Preserve hedging and qualifiers exactly — "may", "is associated with", "suggests" carry evidential weight and must not be strengthened or weakened.',
  },
]

// ── Lapis 1: perisai ─────────────────────────────────────────────────────────
//
// Urutan polanya penting: yang paling spesifik lebih dulu, supaya "5 mg/kg/hari"
// tertangkap utuh sebagai satu satuan dan tidak tercabik jadi "5" dan "mg".
const POLA_LINDUNG: Array<{ nama: string; re: RegExp }> = [
  { nama: 'url', re: /https?:\/\/[^\s<>"']+/g },
  // Tekanan darah HARUS lebih dulu daripada pola nilai bersatuan. Kalau tidak,
  // "150/95 mmHg" tercabik: bagian "95 mmHg" tertangkap duluan sebagai nilai
  // dan menyisakan "150/" telanjang di teks yang dikirim ke model — yang
  // artinya angka sistolik bisa berubah tanpa terdeteksi. Ini ditemukan saat
  // menguji, bukan saat membaca kode.
  { nama: 'tekanan', re: /\b\d{2,3}\s?\/\s?\d{2,3}(?:\s?mmHg)?/g },
  // Dosis lengkap termasuk laju dan per-berat-badan.
  { nama: 'dosis', re: /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|g|kg|mL|ml|L|IU|U|mmol|mEq|ng|pg)(?:\s?\/\s?(?:kg|m2|m²|hari|day|jam|hour|h|min|menit|dose|dosis))*\b/gi },
  // Angka berikut satuan klinis lain. TIDAK diakhiri \b: satuan yang berakhir
  // dengan karakter bukan-huruf seperti "%" tidak punya batas kata sesudahnya,
  // sehingga "8.2%" dan "92%" dulu lolos tanpa perlindungan sama sekali.
  { nama: 'nilai', re: /\b\d+(?:[.,]\d+)?\s?(?:mmHg|cmH2O|bpm|°C|°F|mg\/dL|mmol\/L|g\/dL|U\/L|mL\/min|kcal|%)/gi },
  // Lama pemberian & frekuensi. Angka telanjang seperti "7" pada "selama 7
  // hari" juga menentukan terapi, dan model bebas mengubahnya kalau tidak
  // dilindungi.
  { nama: 'durasi', re: /\b\d+(?:[.,]\d+)?\s?(?:hari|days?|minggu|weeks?|bulan|months?|tahun|years?|jam|hours?|menit|minutes?|x\/hari|kali sehari)\b/gi },
  // Kode klasifikasi: ICD-10/11, ATC, LOINC, SNOMED.
  { nama: 'kode', re: /\b(?:[A-TV-Z][0-9][0-9AB](?:\.[0-9A-Z]{1,4})?|[A-Z]\d{2}[A-Z]{2}\d{2}|\d{4,6}-\d)\b/g },
  { nama: 'ontologi', re: /\b(?:DOID|HP|UBERON|FMA|MONDO|RXCUI|PMID|NCT)[:_]?\d+\b/gi },
  // Rentang & perbandingan numerik.
  { nama: 'rentang', re: /\b\d+(?:[.,]\d+)?\s?[–-]\s?\d+(?:[.,]\d+)?\b/g },
]

export interface Perisai {
  teks: string
  /** Penanda -> teks asli. Dipakai untuk memulihkan sesudah terjemahan. */
  peta: Map<string, string>
}

/** Mencabut semua yang tidak boleh diterjemahkan dan menggantinya penanda. */
export function pasangPerisai(sumber: string, istilahTetap: string[] = []): Perisai {
  const peta = new Map<string, string>()
  let teks = sumber
  let n = 0
  const ganti = (cocok: string): string => {
    // Teks yang sama dilindungi dengan penanda yang sama, supaya penandanya
    // tidak meledak jumlahnya pada teks panjang yang mengulang satu istilah.
    for (const [k, v] of peta) if (v === cocok) return k
    const kunci = `⟦${n++}⟧`
    peta.set(kunci, cocok)
    return kunci
  }
  for (const { re } of POLA_LINDUNG) {
    teks = teks.replace(re, (m) => ganti(m))
  }
  // Istilah tetap dari pemanggil: nama zat aktif, Terminologia Anatomica, dsb.
  // Yang terpanjang lebih dulu supaya "arteria coronaria" tidak dipotong oleh
  // "arteria".
  for (const istilah of [...istilahTetap].sort((a, b) => b.length - a.length)) {
    if (!istilah.trim()) continue
    const aman = istilah.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    teks = teks.replace(new RegExp(`\\b${aman}\\b`, 'gi'), (m) => ganti(m))
  }
  return { teks, peta }
}

/** Mengembalikan teks asli ke tempat penandanya. */
export function bukaPerisai(teks: string, peta: Map<string, string>): { hasil: string; hilang: string[] } {
  let hasil = teks
  const hilang: string[] = []
  for (const [kunci, asli] of peta) {
    if (!hasil.includes(kunci)) { hilang.push(asli); continue }
    hasil = hasil.split(kunci).join(asli)
  }
  return { hasil, hilang }
}

export interface HasilTerjemah {
  teks: string
  dari: string
  ke: string
  register: Register
  /** Istilah yang dilindungi dan berhasil dikembalikan utuh. */
  dilindungi: string[]
  /** Catatan penerjemah — pilihan kata yang perlu diketahui pembaca. */
  catatan: string[]
}

function bangunSystem(dari: string, ke: string, register: Register): string {
  const namaDari = BAHASA.find((b) => b.kode === dari)?.nama ?? dari
  const namaKe = BAHASA.find((b) => b.kode === ke)?.nama ?? ke
  const reg = REGISTER.find((r) => r.key === register) ?? REGISTER[1]
  return [
    `You are a professional medical translator working from ${namaDari} into ${namaKe}.`,
    '',
    'HOW TO TRANSLATE',
    '- Translate MEANING, not words. Recast the sentence the way a native speaker of the target language would actually write it. A translation that is grammatical but reads as translated has failed.',
    '- Read the whole passage before choosing terms, so that a word used twice is rendered consistently.',
    '- Use the established clinical term of the target language where one exists. Do not invent a calque when the profession already has a word.',
    `- REGISTER: ${reg.arahan}`,
    '',
    'ABSOLUTE RULES',
    '- Placeholders that look like ⟦0⟧, ⟦1⟧ are protected content: numbers, doses, codes and fixed terms. Reproduce every placeholder EXACTLY, unchanged, in the natural position the target language requires. Never translate, renumber, merge, drop or add one.',
    '- Never change a number, a unit, a dose, or a laterality (left/right). If the source is ambiguous, keep the ambiguity — do not resolve it.',
    '- Preserve negation and hedging exactly. "No evidence of X" must not become "X is absent"; "may cause" must not become "causes".',
    '- Keep the original paragraph and line structure, including lists.',
    '- Translate only. Do not answer questions in the text, do not add advice, do not omit content you disagree with.',
    '',
    'OUTPUT',
    'Return JSON only, with this exact shape:',
    '{"translation": "<the translated text>", "notes": ["<short note on any word choice a reader should know about, or omit the field entirely if there is nothing worth saying>"]}',
  ].join('\n')
}

type PanggilAi = (system: string, prompt: string, maxTokens: number) => Promise<string>

/**
 * Menerjemahkan satu teks. `panggilAi` disuntikkan supaya modul ini tidak
 * terikat pada satu penyedia dan bisa diuji tanpa jaringan.
 */
export async function terjemahkan(
  panggilAi: PanggilAi,
  sumber: string,
  dari: string,
  ke: string,
  register: Register = 'klinis',
  istilahTetap: string[] = [],
): Promise<HasilTerjemah> {
  const teks = sumber.trim()
  if (!teks) throw new Error('teks_kosong')
  if (dari === ke) {
    return { teks, dari, ke, register, dilindungi: [], catatan: ['Source and target language are the same.'] }
  }

  const perisai = pasangPerisai(teks, istilahTetap)
  const system = bangunSystem(dari, ke, register)
  const balasan = await panggilAi(system, perisai.teks, Math.min(Math.max(teks.length * 3, 512), 8000))

  let terjemahan = ''
  let catatan: string[] = []
  try {
    const bersih = balasan.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const j = JSON.parse(bersih) as { translation?: string; notes?: string[] }
    terjemahan = (j.translation ?? '').trim()
    catatan = Array.isArray(j.notes) ? j.notes.filter((n) => typeof n === 'string') : []
  } catch {
    // Balasan yang bukan JSON dipakai apa adanya — separuh berguna lebih baik
    // daripada galat, SELAMA pemeriksaan perisai di bawah tetap dijalankan.
    terjemahan = balasan.trim()
  }
  if (!terjemahan) throw new Error('terjemahan_kosong')

  const { hasil, hilang } = bukaPerisai(terjemahan, perisai.peta)
  if (hilang.length) {
    // Inilah gerbang keselamatannya. Penanda yang hilang berarti model
    // menghapus atau mengubah sesuatu yang dilindungi — dosis, kode, atau
    // nama obat. Terjemahan seperti itu TIDAK diterbitkan, karena kesalahannya
    // justru tidak kelihatan oleh pembaca yang tidak menguasai bahasa asalnya.
    throw new Error(`perisai_hilang:${hilang.slice(0, 5).join(', ')}`)
  }

  return {
    teks: hasil,
    dari,
    ke,
    register,
    dilindungi: [...perisai.peta.values()],
    catatan,
  }
}
