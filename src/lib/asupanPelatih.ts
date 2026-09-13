// Tanya dulu, jangan berasumsi.
//
// Keempat peran di bawah -- pelatih pribadi, rencana transformasi, rencana
// makan pekanan, ahli gizi -- semuanya berdiri di atas satu aturan yang sama:
// KUMPULKAN MASUKANNYA SEBELUM MEMBUAT RENCANA. Aturan itu bukan kesantunan.
// Ia satu-satunya hal yang memisahkan rencana milik seseorang dari rencana
// milik orang yang tidak ada.
//
// Panacea sudah punya mesinnya: hitungTdee (Mifflin-St Jeor 1990, rentang
// protein ISSN/ACSM) dan susunPekan untuk jadwal kekuatan. Yang belum ada
// adalah penjaga di depannya. hitungTdee menyulih 70 kg, 170 cm dan 30 tahun
// ketika masukannya kosong, lalu mencetak target kalori dan protein seolah
// dihitung untuk orang yang bertanya. Berkas ini menolak keadaan itu lewat,
// dan MENYEBUT apa yang belum ada alih-alih menambalnya.

export type PeranPelatih = 'pelatih' | 'transformasi' | 'menu' | 'gizi'

export type Masukan =
  | 'usia' | 'tinggi' | 'berat' | 'sex'
  | 'tingkatKebugaran' | 'cedera' | 'peralatan' | 'jadwal'
  | 'kebiasaanMakan' | 'jamTidur' | 'tujuan'
  | 'pantangan' | 'alergi' | 'preferensiMakan' | 'anggaran' | 'tingkatAktivitas'

export interface DefinisiMasukan {
  id: Masukan
  label: string
  /** Kenapa rencananya tidak bisa berdiri tanpa ini. */
  alasan: string
  /** Wajib berarti rencananya TIDAK dibuat tanpa ini, bukan dibuat dengan tebakan. */
  wajib: boolean
}

export const MASUKAN: Readonly<Record<Masukan, DefinisiMasukan>> = {
  usia: { id: 'usia', label: 'Age', alasan: 'Enters the Mifflin-St Jeor equation directly; a wrong age shifts every calorie figure.', wajib: true },
  tinggi: { id: 'tinggi', label: 'Height', alasan: 'Enters the same equation. Substituting a default height invents a different body.', wajib: true },
  berat: { id: 'berat', label: 'Body weight', alasan: 'Drives both energy needs and the protein target in grams per kilogram.', wajib: true },
  sex: { id: 'sex', label: 'Sex', alasan: 'Mifflin-St Jeor uses a different constant for each; the gap is about 166 kcal.', wajib: true },
  tingkatAktivitas: { id: 'tingkatAktivitas', label: 'Activity level', alasan: 'Multiplies resting energy by between 1.375 and 1.9 — the single largest factor in the result.', wajib: true },
  tujuan: { id: 'tujuan', label: 'Goal', alasan: 'Decides whether the target sits below, at, or above maintenance.', wajib: true },
  tingkatKebugaran: { id: 'tingkatKebugaran', label: 'Fitness level', alasan: 'Sets the starting volume. The same session is training for one person and injury for another.', wajib: true },
  cedera: { id: 'cedera', label: 'Injuries and limitations', alasan: 'Recorded so movements can be excluded. Panacea does not rehabilitate an injury; it avoids programming into one.', wajib: true },
  peralatan: { id: 'peralatan', label: 'Available equipment', alasan: 'A plan naming equipment you do not have is not a plan.', wajib: true },
  jadwal: { id: 'jadwal', label: 'Days available per week', alasan: 'Decides how many sessions can exist at all before anything is scheduled.', wajib: true },
  jamTidur: { id: 'jamTidur', label: 'Hours of sleep', alasan: 'Recorded as context for recovery. It is not used to compute a training load here.', wajib: false },
  kebiasaanMakan: { id: 'kebiasaanMakan', label: 'Current eating habits', alasan: 'Meals per day divides the daily target into portions.', wajib: false },
  alergi: { id: 'alergi', label: 'Food allergies', alasan: 'Recorded so foods can be excluded. Panacea does not screen any food list for allergens.', wajib: true },
  pantangan: { id: 'pantangan', label: 'Dietary restrictions', alasan: 'Religious, medical or ethical restrictions that a meal plan must not cross.', wajib: false },
  preferensiMakan: { id: 'preferensiMakan', label: 'Food preferences', alasan: 'A plan you will not eat produces no result, however correct its arithmetic.', wajib: false },
  anggaran: { id: 'anggaran', label: 'Budget', alasan: 'Recorded as context. Panacea does not price food.', wajib: false },
}

export const PERAN: Readonly<Record<PeranPelatih, { judul: string; ringkas: string; perlu: Masukan[] }>> = {
  pelatih: {
    judul: 'Personal trainer',
    ringkas: 'A weekly training plan with recovery and a way to see progress.',
    perlu: ['usia', 'tinggi', 'berat', 'sex', 'tingkatKebugaran', 'cedera', 'peralatan', 'jadwal', 'jamTidur', 'tujuan'],
  },
  transformasi: {
    judul: 'Transformation plan',
    ringkas: 'Training, nutrition, hydration, recovery and a weekly review together.',
    perlu: ['usia', 'tinggi', 'berat', 'sex', 'tingkatAktivitas', 'tujuan', 'tingkatKebugaran', 'cedera', 'jadwal', 'jamTidur'],
  },
  menu: {
    judul: 'Weekly meal plan',
    ringkas: 'Daily energy and protein targets split into meals you would actually repeat.',
    perlu: ['usia', 'tinggi', 'berat', 'sex', 'tingkatAktivitas', 'tujuan', 'alergi', 'pantangan', 'preferensiMakan', 'kebiasaanMakan', 'anggaran'],
  },
  gizi: {
    judul: 'Nutritionist',
    ringkas: 'Protein and hydration targets plus habits that survive past a week.',
    perlu: ['usia', 'tinggi', 'berat', 'sex', 'tingkatAktivitas', 'tujuan', 'alergi', 'pantangan', 'kebiasaanMakan'],
  },
}

/** Nilai yang BENAR-BENAR dimiliki. Kosong berarti kosong, bukan nilai bawaan. */
export type Terisi = Partial<Record<Masukan, unknown>>

export interface Kesiapan {
  peran: PeranPelatih
  /** Masukan wajib yang belum ada. Selama ini tidak kosong, rencana TIDAK dibuat. */
  kurangWajib: Masukan[]
  /** Masukan opsional yang belum ada; rencananya tetap dibuat, tetapi lebih kasar. */
  kurangOpsional: Masukan[]
  siap: boolean
}

function ada(nilai: unknown): boolean {
  if (nilai === null || nilai === undefined) return false
  if (typeof nilai === 'string') return nilai.trim().length > 0
  if (typeof nilai === 'number') return Number.isFinite(nilai) && nilai > 0
  if (Array.isArray(nilai)) return nilai.length > 0
  if (typeof nilai === 'boolean') return true
  return false
}

/**
 * Apakah peran ini boleh menghasilkan rencana?
 *
 * Tidak ada jalan tengah: satu masukan wajib yang hilang berarti tidak ada
 * rencana. Menghasilkan rencana "sementara" dari nilai sulih adalah cara
 * paling mudah membuat seseorang mengikuti angka milik orang lain.
 */
export function periksaKesiapan(peran: PeranPelatih, terisi: Terisi): Kesiapan {
  const perlu = PERAN[peran].perlu
  const kurangWajib = perlu.filter((m) => MASUKAN[m].wajib && !ada(terisi[m]))
  const kurangOpsional = perlu.filter((m) => !MASUKAN[m].wajib && !ada(terisi[m]))
  return { peran, kurangWajib, kurangOpsional, siap: kurangWajib.length === 0 }
}

/**
 * Nilai yang akan DISULIH hitungTdee bila dibiarkan menerima kekosongan.
 *
 * Bukan tuduhan terhadap fungsi itu: menyulih agar tidak pecah adalah pilihan
 * yang masuk akal untuk sebuah kalkulator. Yang tidak masuk akal adalah
 * menampilkan hasilnya tanpa mengatakan bahwa tiga angka dasarnya bukan milik
 * orang yang membacanya.
 */
export const SULIHAN_TDEE = { beratKg: 70, tinggiCm: 170, umur: 30, sex: 'M' } as const

export function sulihanTerpakai(terisi: Terisi): string[] {
  const keluar: string[] = []
  if (!ada(terisi.berat)) keluar.push(`body weight → ${SULIHAN_TDEE.beratKg} kg`)
  if (!ada(terisi.tinggi)) keluar.push(`height → ${SULIHAN_TDEE.tinggiCm} cm`)
  if (!ada(terisi.usia)) keluar.push(`age → ${SULIHAN_TDEE.umur} years`)
  if (!ada(terisi.sex)) keluar.push(`sex → ${SULIHAN_TDEE.sex}`)
  return keluar
}

/**
 * Batas yang tidak boleh hilang dari layar mana pun yang memakai berkas ini.
 *
 * Disimpan sebagai data, bukan kalimat di dalam komponen, supaya ia tidak bisa
 * ikut terhapus ketika tata letaknya diubah.
 */
export const BATAS_PELATIH: readonly string[] = [
  'Every figure here is arithmetic on the numbers you entered. Nothing is measured, and no scan, blood test or clinician has been involved.',
  'Mifflin-St Jeor estimates resting energy for a population; individual measured values commonly differ by about 10% in either direction, and more with unusual body composition.',
  'Allergies and injuries are recorded so that foods and movements can be EXCLUDED. Panacea does not screen any food for allergens and does not treat or rehabilitate an injury.',
  'This is general fitness and nutrition education. It is not a diet prescription, not a treatment plan, and not appropriate to follow unmodified during pregnancy, an eating disorder, diabetes, kidney disease, or any condition where intake is clinically managed.',
]
