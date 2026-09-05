import type { Anamnesis, PhysicalExam, ProblemEntry } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// AI-EMR OTONOM — dengan MANUSIA DI DALAM LINGKARAN, bukan di sampingnya.
//
// Alurnya persis yang diminta:
//   1. Percakapan chatbot dengan pasien  -> anamnesis terisi SENDIRI
//   2. Anamnesis                          -> kemungkinan diagnosis diusulkan AI
//   3. Pemeriksaan fisik                  -> DIISI MANUSIA (tidak bisa lain:
//                                            tidak ada model yang bisa meraba
//                                            perut atau mendengar paru)
//   4. Anamnesis + pemeriksaan fisik      -> lab & radiologi DIPESAN SENDIRI
//   5. Hasil lab & radiologi              -> DITAFSIRKAN SENDIRI masuk ke rekam
//   6. Tafsiran                           -> resep disusun AI
//   7. Resep                              -> DIPERIKSA MANUSIA sebelum berlaku
//   8. Kontrol & kunjungan berikutnya     -> dijadwalkan sendiri
//
// PEMBAGIAN KERJA YANG DISENGAJA, dan ini bagian terpenting berkas ini.
//
// Yang boleh dikerjakan MODEL BAHASA: menyusun narasi, merangkum percakapan
// jadi anamnesis terstruktur, dan mengusulkan kemungkinan diagnosis. Semua itu
// pekerjaan bahasa, dan salahnya kelihatan saat dibaca.
//
// Yang TIDAK BOLEH diserahkan ke model bahasa, dan di sini dikerjakan ATURAN
// DETERMINISTIK: memilih pemeriksaan apa yang dipesan, menyatakan sebuah nilai
// lab normal atau tidak, dan memeriksa keamanan obat. Ketiganya punya jawaban
// yang benar dan bisa diperiksa; menyerahkannya ke model berarti mengarang
// dengan percaya diri pada hal yang justru tidak boleh dikarang. Aturan di
// bawah bisa dibaca, diuji, dan dibantah — keluaran model tidak.
//
// GERBANG MANUSIA. Tiap tahap yang MENGIKAT secara klinis punya gerbang yang
// tidak bisa dilewati otomatis: pemeriksaan fisik harus diisi dokter, dan resep
// harus disetujui dokter. Sisanya berjalan sendiri. "Otonom" di sini berarti
// tidak ada pekerjaan menyalin data yang tersisa untuk manusia — BUKAN berarti
// tidak ada dokter yang bertanggung jawab.
// ─────────────────────────────────────────────────────────────────────────────

export type TahapKey =
  | 'anamnesis' | 'diagnosis' | 'fisik' | 'order' | 'hasil' | 'resep' | 'kontrol'

export interface Tahap {
  key: TahapKey
  label: string
  /** Siapa yang mengerjakan. */
  pelaku: 'ai' | 'dokter' | 'sistem'
  /** true = tidak bisa lanjut tanpa persetujuan manusia. */
  gerbang: boolean
  /** Kenapa pembagiannya begitu — ikut tampil di layar. */
  alasan: string
}

export const TAHAP: Tahap[] = [
  { key: 'anamnesis', label: 'History from chat', pelaku: 'ai', gerbang: false,
    alasan: 'Summarising a conversation into a structured history is a language task, and mistakes are visible on reading.' },
  { key: 'diagnosis', label: 'Differential diagnosis', pelaku: 'ai', gerbang: false,
    alasan: 'Proposed, never committed — the working diagnosis is only fixed once a doctor accepts it.' },
  { key: 'fisik', label: 'Physical examination', pelaku: 'dokter', gerbang: true,
    alasan: 'No model can palpate an abdomen or auscultate a chest. This must be entered by the examining doctor.' },
  { key: 'order', label: 'Labs & imaging ordered', pelaku: 'sistem', gerbang: false,
    alasan: 'Chosen by explicit indication rules, not by a language model — what to order has a checkable right answer.' },
  { key: 'hasil', label: 'Results interpreted', pelaku: 'sistem', gerbang: false,
    alasan: 'Flagged against reference ranges arithmetically. A number is inside its range or it is not.' },
  { key: 'resep', label: 'Prescription', pelaku: 'ai', gerbang: true,
    alasan: 'Drafted by AI, checked automatically for interactions, and NOT valid until a doctor signs it.' },
  { key: 'kontrol', label: 'Follow-up & visit', pelaku: 'sistem', gerbang: false,
    alasan: 'Interval scheduled from the condition and the abnormal results, so nothing depends on remembering.' },
]

// ── Pemesanan pemeriksaan: aturan indikasi, bukan tebakan ────────────────────
//
// Tiap aturan menyatakan: kalau kata kunci INI muncul di anamnesis atau
// pemeriksaan fisik, pemeriksaan ITU diindikasikan, DAN inilah alasannya.
// Alasannya wajib, karena pemeriksaan tanpa indikasi yang bisa dinyatakan
// adalah pemeriksaan yang tidak seharusnya dipesan.
export interface AturanOrder {
  cocok: RegExp
  pemeriksaan: string
  jenis: 'lab' | 'radiologi'
  indikasi: string
  /** Segera = tidak menunggu jadwal biasa. */
  segera?: boolean
}

export const ATURAN_ORDER: AturanOrder[] = [
  // Kegawatan lebih dulu — urutannya menentukan apa yang muncul di atas.
  { cocok: /nyeri dada|chest pain|angina/i, pemeriksaan: 'ECG (12-lead)', jenis: 'radiologi', indikasi: 'Chest pain — exclude acute coronary syndrome', segera: true },
  { cocok: /nyeri dada|chest pain/i, pemeriksaan: 'Troponin I/T', jenis: 'lab', indikasi: 'Chest pain — myocardial injury marker', segera: true },
  { cocok: /sesak|dyspnoea|dyspnea|shortness of breath/i, pemeriksaan: 'Chest X-ray', jenis: 'radiologi', indikasi: 'Breathlessness — assess lung fields, heart size, effusion' },
  { cocok: /sesak|dyspnoea|dyspnea/i, pemeriksaan: 'Blood gas analysis', jenis: 'lab', indikasi: 'Breathlessness — oxygenation and acid–base state' },
  { cocok: /demam|fever|febris/i, pemeriksaan: 'Full blood count', jenis: 'lab', indikasi: 'Fever — infection screen and differential' },
  { cocok: /demam|fever/i, pemeriksaan: 'C-reactive protein', jenis: 'lab', indikasi: 'Fever — inflammatory activity' },
  { cocok: /batuk\s*(lama|kronis)|cough.*(weeks|chronic)|hemoptisis|haemoptysis|batuk darah/i, pemeriksaan: 'Sputum AFB / GeneXpert', jenis: 'lab', indikasi: 'Prolonged cough or haemoptysis — exclude tuberculosis' },
  { cocok: /nyeri perut|abdominal pain|perut kanan bawah/i, pemeriksaan: 'Abdominal ultrasound', jenis: 'radiologi', indikasi: 'Abdominal pain — assess solid organs, biliary tree, free fluid' },
  { cocok: /muntah|vomit|diare|diarrh/i, pemeriksaan: 'Serum electrolytes', jenis: 'lab', indikasi: 'Vomiting or diarrhoea — electrolyte loss' },
  { cocok: /kuning|jaundice|ikterus|ikterik/i, pemeriksaan: 'Liver function tests', jenis: 'lab', indikasi: 'Jaundice — hepatocellular versus cholestatic pattern' },
  { cocok: /kencing|urin|dysuria|nyeri berkemih|bak/i, pemeriksaan: 'Urinalysis', jenis: 'lab', indikasi: 'Urinary symptoms — infection, haematuria, proteinuria' },
  { cocok: /bengkak|oedema|edema|sembab/i, pemeriksaan: 'Urea, creatinine & eGFR', jenis: 'lab', indikasi: 'Oedema — renal function and protein loss' },
  { cocok: /lemas|fatigue|pucat|pallor|anemi/i, pemeriksaan: 'Full blood count + iron studies', jenis: 'lab', indikasi: 'Fatigue or pallor — anaemia and its cause' },
  { cocok: /haus|poliuri|polyuria|berat badan turun|weight loss|gula darah/i, pemeriksaan: 'Fasting glucose & HbA1c', jenis: 'lab', indikasi: 'Osmotic symptoms — diabetes screening' },
  { cocok: /trauma|jatuh|kecelakaan|fracture|patah/i, pemeriksaan: 'Plain radiograph of the injured region', jenis: 'radiologi', indikasi: 'Trauma — exclude fracture', segera: true },
  { cocok: /kejang|seizure|penurunan kesadaran|unconscious|stroke|lemah separuh|hemiparesis/i, pemeriksaan: 'Non-contrast head CT', jenis: 'radiologi', indikasi: 'Acute neurological deficit — exclude haemorrhage before any thrombolysis', segera: true },
  { cocok: /jantung berdebar|palpitation|berdebar/i, pemeriksaan: 'ECG (12-lead)', jenis: 'radiologi', indikasi: 'Palpitations — document the rhythm' },
  { cocok: /hipertensi|tekanan darah tinggi|hypertension/i, pemeriksaan: 'Lipid profile', jenis: 'lab', indikasi: 'Hypertension — cardiovascular risk assessment' },
  { cocok: /hamil|pregnan|terlambat haid/i, pemeriksaan: 'Obstetric ultrasound', jenis: 'radiologi', indikasi: 'Possible pregnancy — confirm site and viability' },
]

export interface OrderTerbit {
  id: string
  pemeriksaan: string
  jenis: 'lab' | 'radiologi'
  indikasi: string
  segera: boolean
  /** Dari mana teksnya berasal — supaya bisa ditelusuri balik. */
  dari: 'anamnesis' | 'pemeriksaan fisik'
}

/**
 * Menerbitkan daftar pemeriksaan dari anamnesis dan pemeriksaan fisik.
 *
 * Deterministik dengan sengaja: masukan yang sama SELALU menghasilkan daftar
 * yang sama, dan tiap butir membawa indikasinya. Kalau tidak ada aturan yang
 * cocok, hasilnya KOSONG — tidak ada pemeriksaan "untuk berjaga-jaga", karena
 * pemeriksaan tanpa indikasi menghasilkan temuan kebetulan yang lalu dikejar
 * dengan pemeriksaan berikutnya.
 */
export function terbitkanOrder(anamnesis: Anamnesis, fisik: PhysicalExam): OrderTerbit[] {
  const teksAnamnesis = [
    anamnesis.keluhanUtama, anamnesis.rps, anamnesis.rpd, anamnesis.riwayatPengobatan,
  ].join(' \n ')
  const teksFisik = [fisik.general, fisik.vitalsNote, fisik.perSystem].join(' \n ')

  const keluar: OrderTerbit[] = []
  for (const sumber of [
    { teks: teksAnamnesis, dari: 'anamnesis' as const },
    { teks: teksFisik, dari: 'pemeriksaan fisik' as const },
  ]) {
    for (const aturan of ATURAN_ORDER) {
      if (!aturan.cocok.test(sumber.teks)) continue
      // Satu pemeriksaan tidak dipesan dua kali walau dua keluhan
      // mengindikasikannya; indikasi pertamanya yang dicatat.
      if (keluar.some((o) => o.pemeriksaan === aturan.pemeriksaan)) continue
      keluar.push({
        id: `${aturan.jenis}-${keluar.length}-${aturan.pemeriksaan}`,
        pemeriksaan: aturan.pemeriksaan,
        jenis: aturan.jenis,
        indikasi: aturan.indikasi,
        segera: Boolean(aturan.segera),
        dari: sumber.dari,
      })
    }
  }
  // Yang segera naik ke atas.
  return keluar.sort((a, b) => (a.segera === b.segera ? 0 : a.segera ? -1 : 1))
}

// ── Penafsiran hasil: aritmetika, bukan bahasa ───────────────────────────────

export interface RentangRujukan {
  nama: string
  satuan: string
  bawah: number
  atas: number
  /** Apa artinya kalau tinggi / rendah — supaya nilainya bukan sekadar bendera. */
  tinggi: string
  rendah: string
}

export const RUJUKAN: RentangRujukan[] = [
  { nama: 'Haemoglobin', satuan: 'g/dL', bawah: 12, atas: 16, tinggi: 'Polycythaemia, or haemoconcentration from dehydration', rendah: 'Anaemia — the cause still has to be found' },
  { nama: 'Leukocytes', satuan: '10³/µL', bawah: 4, atas: 11, tinggi: 'Infection, inflammation, or steroid effect', rendah: 'Marrow suppression, overwhelming sepsis, or viral illness' },
  { nama: 'Platelets', satuan: '10³/µL', bawah: 150, atas: 400, tinggi: 'Reactive thrombocytosis or a myeloproliferative disorder', rendah: 'Bleeding risk — dengue, ITP, sepsis, marrow failure' },
  { nama: 'Sodium', satuan: 'mmol/L', bawah: 135, atas: 145, tinggi: 'Water deficit rather than salt excess, in most cases', rendah: 'Hyponatraemia — correct slowly to avoid osmotic demyelination' },
  { nama: 'Potassium', satuan: 'mmol/L', bawah: 3.5, atas: 5.1, tinggi: 'Cardiac arrhythmia risk — check ECG urgently', rendah: 'Arrhythmia and weakness; also check magnesium' },
  { nama: 'Creatinine', satuan: 'mg/dL', bawah: 0.6, atas: 1.2, tinggi: 'Reduced glomerular filtration — separate pre-renal from renal', rendah: 'Low muscle mass; rarely of concern on its own' },
  { nama: 'Urea', satuan: 'mg/dL', bawah: 15, atas: 45, tinggi: 'Dehydration, GI bleeding, or renal impairment', rendah: 'Low protein intake or liver failure' },
  { nama: 'Random glucose', satuan: 'mg/dL', bawah: 70, atas: 140, tinggi: 'Hyperglycaemia — confirm with fasting glucose or HbA1c', rendah: 'Hypoglycaemia — treat before investigating' },
  { nama: 'HbA1c', satuan: '%', bawah: 4, atas: 5.6, tinggi: '≥6.5% is diagnostic of diabetes; 5.7–6.4% is prediabetes', rendah: 'Rarely meaningful; consider shortened red cell survival' },
  { nama: 'ALT', satuan: 'U/L', bawah: 7, atas: 45, tinggi: 'Hepatocellular injury', rendah: 'Not clinically significant' },
  { nama: 'Total bilirubin', satuan: 'mg/dL', bawah: 0.2, atas: 1.2, tinggi: 'Jaundice appears clinically above roughly 2.5 mg/dL', rendah: 'Not clinically significant' },
  { nama: 'CRP', satuan: 'mg/L', bawah: 0, atas: 5, tinggi: 'Active inflammation — not specific to infection', rendah: 'Normal' },
  { nama: 'Troponin I', satuan: 'ng/mL', bawah: 0, atas: 0.04, tinggi: 'Myocardial injury — interpret against the rise-and-fall pattern, not one value', rendah: 'Normal' },
]

export interface HasilLab { nama: string; nilai: number }

export interface TafsiranLab {
  nama: string
  nilai: number
  satuan: string
  rentang: string
  status: 'rendah' | 'normal' | 'tinggi'
  arti: string
}

/** Membandingkan hasil terhadap rentang rujukan. Tidak ada penilaian di luar
 *  perbandingan itu — nilai di luar rentang belum tentu penyakit, dan nilai di
 *  dalam rentang tidak menyingkirkannya. */
export function tafsirkanLab(hasil: HasilLab[]): TafsiranLab[] {
  const keluar: TafsiranLab[] = []
  for (const h of hasil) {
    const r = RUJUKAN.find((x) => x.nama.toLowerCase() === h.nama.toLowerCase())
    if (!r) continue
    const status = h.nilai < r.bawah ? 'rendah' : h.nilai > r.atas ? 'tinggi' : 'normal'
    keluar.push({
      nama: r.nama,
      nilai: h.nilai,
      satuan: r.satuan,
      rentang: `${r.bawah}–${r.atas}`,
      status,
      arti: status === 'tinggi' ? r.tinggi : status === 'rendah' ? r.rendah : 'Within the reference range',
    })
  }
  return keluar
}

// ── Kontrol & kunjungan ──────────────────────────────────────────────────────

export interface JadwalKontrol {
  hari: number
  alasan: string
  mendesak: boolean
}

/**
 * Menentukan jarak kontrol dari kondisi dan hasil yang menyimpang.
 * Yang paling mendesak yang menang — bukan rata-ratanya.
 */
export function jadwalkanKontrol(
  masalah: ProblemEntry[],
  tafsiran: TafsiranLab[],
  adaOrderSegera: boolean,
): JadwalKontrol {
  if (adaOrderSegera) {
    return { hari: 0, alasan: 'An urgent investigation was ordered — review as soon as the result returns, same day.', mendesak: true }
  }
  const kritis = tafsiran.find(
    (t) => (t.nama === 'Potassium' && (t.nilai < 3 || t.nilai > 6)) ||
           (t.nama === 'Haemoglobin' && t.nilai < 8) ||
           (t.nama === 'Platelets' && t.nilai < 50) ||
           (t.nama === 'Troponin I' && t.status === 'tinggi'),
  )
  if (kritis) {
    return { hari: 1, alasan: `${kritis.nama} is at a level that needs review within 24 hours, not at a routine interval.`, mendesak: true }
  }
  const adaMenyimpang = tafsiran.some((t) => t.status !== 'normal')
  if (adaMenyimpang) {
    return { hari: 7, alasan: 'Abnormal results that are not critical — repeat and review in one week.', mendesak: false }
  }
  if (masalah.length > 0) {
    return { hari: 30, alasan: 'An active problem with normal investigations — routine review in one month.', mendesak: false }
  }
  return { hari: 90, alasan: 'No active problem and no abnormal result — routine review in three months.', mendesak: false }
}
