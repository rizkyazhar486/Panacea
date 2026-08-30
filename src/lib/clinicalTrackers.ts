// ─────────────────────────────────────────────────────────────────────────────
// Pelacak klinis yang berdiri sendiri: saturasi oksigen, hasil EKG, jet lag,
// kehamilan, dan fisiologi kursi roda.
//
// Semua di sini memakai masukan yang dicatat sendiri, bukan ekspor jam tangan,
// sehingga tetap bekerja pada perangkat apa pun.
//
// SATU GARIS YANG TIDAK DILANGGAR: modul ini MENCATAT dan MENJELASKAN, tetapi
// tidak MENAFSIRKAN rekaman mentah. Untuk EKG, yang disimpan adalah klasifikasi
// yang sudah dikeluarkan alat berizin (Irama Sinus / Fibrilasi Atrium / Tidak
// Meyakinkan) beserta gejala yang menyertainya — bukan pembacaan gelombang oleh
// perhitungan di sini. Membaca EKG adalah wilayah alat kesehatan berizin dan
// tenaga medis, dan menirunya akan berbahaya justru ketika hasilnya salah.
//
// Nilai yang mengarah ke keputusan klinis selalu disertai tanda bahaya dan
// anjuran memeriksakan diri, bukan sekadar angka.
// ─────────────────────────────────────────────────────────────────────────────

// ═══ 1. SATURASI OKSIGEN ════════════════════════════════════════════════════

export interface BacaanSpo2 {
  waktu: string
  spo2: number
  /** Denyut saat pengukuran, bila alat menampilkannya. */
  nadi?: number
  konteks: 'istirahat' | 'tidur' | 'aktivitas' | 'ketinggian'
  ketinggianM?: number
  catatan?: string
}

export interface AnalisisSpo2 {
  terakhir: BacaanSpo2 | null
  rerata: number | null
  terendah: number | null
  jumlah: number
  band: 'normal' | 'perhatian' | 'rendah' | 'takAda'
  arti: string
  tandaBahaya: string[]
  batasKetinggian: string | null
}

/**
 * Rentang rujukan saturasi pada orang sehat di dataran rendah adalah 95-100%.
 *
 * Dua hal yang membuat angka ini sering disalahartikan, dan keduanya
 * dinyatakan terang-terangan:
 *
 *   1. Saturasi TURUN secara wajar di ketinggian. 90% di 2500 m bukan hal yang
 *      sama dengan 90% di permukaan laut.
 *   2. Alat di jam tangan dan oksimeter jari BUKAN alat diagnostik. Ia meleset
 *      beberapa persen, dan meleset lebih besar pada kulit gelap, jari dingin,
 *      cat kuku, serta gerakan. Angka rendah yang sendirian tanpa gejala paling
 *      sering merupakan kesalahan pengukuran.
 */
export function analisisSpo2(bacaan: BacaanSpo2[]): AnalisisSpo2 {
  const urut = [...bacaan].sort((a, b) => Date.parse(b.waktu) - Date.parse(a.waktu))
  const terakhir = urut[0] ?? null
  const nilai = urut.map((b) => b.spo2).filter((v) => v > 0 && v <= 100)

  if (!nilai.length) {
    return { terakhir: null, rerata: null, terendah: null, jumlah: 0, band: 'takAda',
      arti: 'No readings recorded yet.', tandaBahaya: [], batasKetinggian: null }
  }

  const rerata = +(nilai.reduce((a, b) => a + b, 0) / nilai.length).toFixed(1)
  const terendah = Math.min(...nilai)
  const v = terakhir!.spo2
  const diKetinggian = (terakhir!.ketinggianM ?? 0) >= 1500

  const band: AnalisisSpo2['band'] = v >= 95 ? 'normal' : v >= 91 ? 'perhatian' : 'rendah'

  const arti = band === 'normal'
    ? 'Within the reference range for healthy people at low altitude (95–100%).'
    : band === 'perhatian'
      ? diKetinggian
        ? 'Below 95%, but you are at altitude — a reading like this is normal up there.'
        : 'Slightly below the reference range. If you feel well, take it again with warm, still hands; a single low number with no symptoms is most often a measurement error.'
      : 'Clearly below the reference range. Repeat the measurement; if it stays low AND you have symptoms, this needs to be seen the same day.'

  const tandaBahaya = band === 'normal' ? [] : [
    'Breathlessness that is new or getting worse',
    'Chest pain',
    'Blue lips or fingertips',
    'Confusion, extreme drowsiness, or difficulty waking',
    'Rapid breathing at rest',
  ]

  return {
    terakhir, rerata, terendah, jumlah: nilai.length, band, arti, tandaBahaya,
    batasKetinggian: diKetinggian
      ? `Reading taken at ${terakhir!.ketinggianM} m. Saturation genuinely runs lower at altitude — around 90–94% at 2,500 m is ordinary in healthy people, and the 95–100% range does not apply there.`
      : null,
  }
}

/** Alasan tersering pembacaan rendah yang keliru — diperiksa sebelum panik. */
export const SEBAB_SPO2_KELIRU: string[] = [
  'Cold fingers or reduced circulation in the hand',
  'Movement during the reading, including shivering',
  'Nail polish, false nails, or very thick nails',
  'A watch worn loose or too far up the wrist',
  'Bright light getting between the sensor and the skin',
  'Readings on darker skin tend to run slightly higher than the true value, so a real drop can be missed',
]

// ═══ 2. CATATAN HASIL EKG ═══════════════════════════════════════════════════

export type KlasifikasiEkg = 'sinus' | 'afib' | 'tidakMeyakinkan' | 'nadiTinggi' | 'nadiRendah' | 'lainnya'

export interface CatatanEkg {
  waktu: string
  klasifikasi: KlasifikasiEkg
  nadi?: number
  gejala: string[]
  catatan?: string
}

export interface InfoEkg {
  label: string
  arti: string
  langkah: string
  warna: string
}

/**
 * Penjelasan tiap klasifikasi yang dikeluarkan alat.
 *
 * Perhatikan bahwa tidak ada satu pun yang menafsirkan gelombang: yang
 * dijelaskan adalah arti label yang SUDAH diberikan alat berizin, dan apa yang
 * sebaiknya dilakukan dengan label itu.
 */
export const INFO_EKG: Record<KlasifikasiEkg, InfoEkg> = {
  sinus: {
    label: 'Sinus rhythm',
    arti: 'The device judged the rhythm to be regular and coming from the heart’s own pacemaker, at 50–100 beats per minute during that recording.',
    langkah: 'No action needed if you have no symptoms. Bear in mind that this recording describes only those 30 seconds — a rhythm problem that comes and goes can be missed entirely.',
    warna: '#34d399',
  },
  afib: {
    label: 'Atrial fibrillation',
    arti: 'The device found an irregular pattern resembling atrial fibrillation — an irregular rhythm arising in the atria.',
    langkah: 'THIS NEEDS FOLLOW-UP in person, even if you feel well. Atrial fibrillation raises stroke risk and is often not felt at all. Save the PDF of the recording from the Health app and bring it to the appointment — a doctor will read the trace itself, not the label.',
    warna: '#f87171',
  },
  tidakMeyakinkan: {
    label: 'Inconclusive',
    arti: 'The device could not classify this recording. The usual causes are movement, poor contact, dry skin, or a heart rate outside the range it can assess.',
    langkah: 'Record again with your arm resting on a table, body still, and skin slightly moistened. If it stays inconclusive AND you have symptoms, get checked — do not wait for the device to produce a label.',
    warna: '#fbbf24',
  },
  nadiTinggi: {
    label: 'High heart rate',
    arti: 'The rate was above 100 during the recording, so the device did not assess the rhythm.',
    langkah: 'If you have just moved about, are anxious, feverish, or have had coffee, this is ordinary. Repeat it after a few calm minutes. If the rate stays high at genuine rest and you have symptoms, get checked.',
    warna: '#fbbf24',
  },
  nadiRendah: {
    label: 'Low heart rate',
    arti: 'The rate was below 50 during the recording, so the device did not assess the rhythm.',
    langkah: 'In trained people a low resting rate is common and not a problem. It matters when it comes with light-headedness, fainting, or unusual fatigue — and in anyone taking rate-slowing medication such as a beta blocker.',
    warna: '#fbbf24',
  },
  lainnya: {
    label: 'Other result',
    arti: 'Another classification produced by the device.',
    langkah: 'Save the PDF and show it at your appointment.',
    warna: '#94a3b8',
  },
}

export const GEJALA_EKG: string[] = [
  'Palpitations', 'Chest pain', 'Breathlessness', 'Vertigo', 'Nearly fainting', 'Fainting',
  'Unusual fatigue', 'No symptoms',
]

export interface RingkasEkg {
  total: number
  perKlasifikasi: { k: KlasifikasiEkg; jumlah: number }[]
  adaAfib: boolean
  bergejalaSaatAfib: boolean
  saran: string
  darurat: boolean
}

export function ringkasEkg(catatan: CatatanEkg[]): RingkasEkg {
  const hitung = new Map<KlasifikasiEkg, number>()
  for (const c of catatan) hitung.set(c.klasifikasi, (hitung.get(c.klasifikasi) ?? 0) + 1)

  const afibList = catatan.filter((c) => c.klasifikasi === 'afib')
  const bergejala = afibList.some((c) => c.gejala.some((g) => g !== 'No symptoms'))
  // Gejala yang menuntut pertolongan segera, apa pun label alatnya.
  const gejalaBerat = ['Chest pain', 'Fainting', 'Nearly fainting', 'Breathlessness']
  const darurat = catatan.some((c) => c.gejala.some((g) => gejalaBerat.includes(g)))

  const saran = darurat
    ? 'One or more recordings came with chest pain, breathlessness, or fainting. Symptoms like those need assessing straight away, REGARDLESS of what label the device gave — this device is not designed to recognise a heart attack.'
    : afibList.length > 0
      ? `${afibList.length} recording(s) labelled atrial fibrillation. Bring the PDFs to your appointment; what helps a doctor most is the pattern over time, not the numbers.`
      : catatan.length > 0
        ? 'No recordings labelled atrial fibrillation so far. Keep the history anyway — a pattern over time is far more useful than a single recording.'
        : 'No recordings saved yet.'

  return {
    total: catatan.length,
    perKlasifikasi: [...hitung.entries()].map(([k, jumlah]) => ({ k, jumlah })).sort((a, b) => b.jumlah - a.jumlah),
    adaAfib: afibList.length > 0,
    bergejalaSaatAfib: bergejala,
    saran, darurat,
  }
}

// ═══ 3. PENASIHAT JET LAG ═══════════════════════════════════════════════════

export interface RencanaJetLag {
  bedaJam: number
  arah: 'maju' | 'mundur' | 'tidakAda'
  perkiraanHariPulih: number
  ringkas: string
  /** Rencana harian sebelum dan sesudah terbang. */
  langkah: { hari: string; isi: string[] }[]
  catatan: string[]
}

/**
 * Adjustment plan jam biologis dari zona waktu asal dan tujuan.
 *
 * Dua hal yang menentukan dan sering terbalik dilakukan orang:
 *
 *   1. Terbang KE TIMUR menuntut jam tubuh MAJU, dan itu lebih sulit karena
 *      jam bawaan manusia sedikit lebih panjang daripada 24 jam. Terbang ke
 *      barat menuntut jam MUNDUR, dan itu lebih mudah.
 *   2. Cahaya adalah pengatur terkuat, tetapi WAKTUNYA menentukan arah: cahaya
 *      setelah titik suhu tubuh terendah memajukan jam, sedangkan cahaya
 *      sebelum titik itu justru memundurkannya. Salah waktu berarti memperparah,
 *      bukan memperbaiki.
 *
 * Titik suhu terendah diperkirakan sekitar dua jam sebelum bangun alami.
 */
export function rencanaJetLag(opsi: {
  tzAsal: number
  tzTujuan: number
  jamBangunBiasa: string
  hariPersiapan?: number
}): RencanaJetLag {
  const beda = opsi.tzTujuan - opsi.tzAsal
  // Normalkan ke rentang −12..+12; terbang 20 jam ke timur = 4 jam ke barat.
  let bedaJam = beda
  while (bedaJam > 12) bedaJam -= 24
  while (bedaJam < -12) bedaJam += 24

  const arah = bedaJam === 0 ? 'tidakAda' : bedaJam > 0 ? 'maju' : 'mundur'
  const abs = Math.abs(bedaJam)
  // Ke timur sekitar satu hari per jam; ke barat lebih cepat.
  const perkiraanHariPulih = arah === 'tidakAda' ? 0 : Math.ceil(abs / (arah === 'maju' ? 1 : 1.5))

  const [jamB, menitB] = (opsi.jamBangunBiasa.match(/^(\d{1,2}):(\d{2})$/) ?? [, '7', '00']).slice(1).map(Number)
  const bangunMin = (jamB ?? 7) * 60 + (menitB ?? 0)
  const fmt = (m: number) => {
    const x = ((m % 1440) + 1440) % 1440
    return `${String(Math.floor(x / 60)).padStart(2, '0')}.${String(x % 60).padStart(2, '0')}`
  }
  const titikTerendah = bangunMin - 120

  const catatan: string[] = []
  const langkah: { hari: string; isi: string[] }[] = []

  if (arah === 'tidakAda') {
    return { bedaJam: 0, arah, perkiraanHariPulih: 0,
      ringkas: 'No time-zone difference — no adjustment needed.', langkah: [], catatan: [] }
  }

  const hariSiap = Math.min(opsi.hariPersiapan ?? 3, 4)
  const geserPerHari = arah === 'maju' ? 60 : 90 // menit; ke barat boleh lebih besar

  for (let d = hariSiap; d >= 1; d--) {
    const geser = (hariSiap - d + 1) * geserPerHari * (arah === 'maju' ? -1 : 1)
    langkah.push({
      hari: `D−${d} (before the flight)`,
      isi: [
        `Sleep and wake ${Math.abs(geser) / 60} hour(s) ${arah === 'maju' ? 'earlier' : 'later'} than usual (waking around ${fmt(bangunMin + geser)}).`,
        arah === 'maju'
          ? `Seek bright light immediately on waking, and DIM the light in the evening — evening light pulls your clock the wrong way.`
          : `Seek bright light in the late afternoon and evening, and avoid bright light very early in the morning.`,
      ],
    })
  }

  langkah.push({
    hari: 'Flight day',
    isi: [
      'As soon as you board, set your watch to destination time and start thinking in it.',
      'Sleep on the plane only if it is night at your destination. If it is daytime there, stay awake even if you feel sleepy.',
      'Drink enough water. Avoid alcohol — it worsens sleep quality and slows adjustment.',
      'Caffeine can be used to stay awake, but stop at least 8 hours before bedtime at your destination.',
    ],
  })

  for (let d = 1; d <= Math.min(perkiraanHariPulih, 5); d++) {
    langkah.push({
      hari: `D+${d} (at your destination)`,
      isi: [
        arah === 'maju'
          ? 'Get outside into bright light in the local morning, and wear sunglasses if you must go out before dawn.'
          : 'Seek bright light in the local late afternoon, and avoid long afternoon naps.',
        'Eat on local meal times — meal timing also sets the body clock, though more weakly than light does.',
        'If you are very sleepy, nap for 20–30 minutes at most, and not after 3 pm local time.',
        d === 1 ? 'Lower training intensity on the first day; coordination and your sense of effort are both affected.' : 'Training can be built back up gradually, guided by how you feel.',
      ],
    })
  }

  catatan.push(
    arah === 'maju'
      ? 'Travelling east means the body clock must ADVANCE, and that is the harder direction because the human internal clock runs slightly longer than 24 hours.'
      : 'Travelling west means the body clock DELAYS, which is the easier direction — recovery is usually about one and a half times faster.',
    `Your core temperature low is estimated at around ${fmt(titikTerendah)} in your home time zone. Light AFTER that point advances the clock; light BEFORE it delays the clock. This is why the timing of light exposure matters more than how long it lasts.`,
    'Some people use melatonin to help them adjust, but the dose and timing differ with the direction of travel and are not the same for everyone — talk to a doctor or pharmacist before using it, especially if you take other medication.',
  )

  return {
    bedaJam, arah, perkiraanHariPulih,
    ringkas: `${abs} hour(s) ${arah === 'maju' ? 'east' : 'west'}. Expect roughly ${perkiraanHariPulih} day(s) to adjust if you manage light exposure; without managing light it can take longer.`,
    langkah, catatan,
  }
}

// ═══ 4. KEHAMILAN & AKTIVITAS ═══════════════════════════════════════════════

export interface StatusKehamilan {
  usiaMinggu: number
  usiaHari: number
  trimester: 1 | 2 | 3
  perkiraanLahir: string
  sisaHari: number
}

/** Usia kehamilan dari hari pertama haid terakhir; perkiraan lahir 280 hari. */
export function statusKehamilan(hpht: string, sekarang = Date.now()): StatusKehamilan | null {
  const t = Date.parse(hpht)
  if (Number.isNaN(t) || t > sekarang) return null
  const hari = Math.floor((sekarang - t) / 86_400_000)
  if (hari > 320) return null
  const minggu = Math.floor(hari / 7)
  const trimester: 1 | 2 | 3 = minggu < 14 ? 1 : minggu < 28 ? 2 : 3
  const lahir = new Date(t + 280 * 86_400_000)
  return {
    usiaMinggu: minggu,
    usiaHari: hari % 7,
    trimester,
    perkiraanLahir: lahir.toISOString().slice(0, 10),
    sisaHari: Math.max(0, Math.round((+lahir - sekarang) / 86_400_000)),
  }
}

export interface PanduanOlahragaHamil {
  anjuran: string[]
  hindari: string[]
  tandaBerhenti: string[]
  catatanTrimester: string
  kontraindikasiMutlak: string[]
}

/**
 * Panduan aktivitas dalam kehamilan.
 *
 * Denyut jantung SENGAJA tidak dipakai sebagai patokan intensitas: denyut
 * istirahat meningkat dalam kehamilan dan tanggapannya terhadap beban berubah,
 * sehingga zona berbasis denyut menjadi menyesatkan. Yang dipakai adalah uji
 * bicara — jauh lebih andal pada keadaan ini.
 */
export function panduanOlahragaHamil(trimester: 1 | 2 | 3): PanduanOlahragaHamil {
  const catatanTrimester = trimester === 1
    ? 'First trimester: nausea and fatigue are usually the bigger obstacle, not the exercise itself. Light activity often eases both. Avoid overheating during this period.'
    : trimester === 2
      ? 'Second trimester: usually the most comfortable period for activity. Start avoiding long periods lying flat on your back, as the uterus can press on the major vessels and cause light-headedness.'
      : 'Third trimester: your centre of gravity shifts and balance declines. Favour activities with stable support such as walking, swimming, and a stationary bike.'

  return {
    catatanTrimester,
    anjuran: [
      'The general target is around 150 minutes of moderate-intensity activity per week, spread over several days.',
      'Judge intensity with the TALK TEST rather than heart rate: moderate means you can still speak in full sentences. Heart rate changes in pregnancy, which makes heart-rate zones misleading.',
      'Light to moderate strength training is beneficial and safe in an uncomplicated pregnancy.',
      'Pelvic floor training helps recovery after birth and reduces urinary leakage.',
      'Drink enough, and avoid exercising in high heat or humidity.',
      'Walking, swimming, a stationary bike, and antenatal classes are the lowest-risk options.',
    ],
    hindari: [
      'Sports carrying a risk of impact or falling: contact martial arts, football, basketball, horse riding, skiing, and cycling in traffic or on difficult terrain',
      'Menyelam (scuba)',
      'Activity above 2,500 m if you are not acclimatised',
      'Berbaring telentang lama setelah trimester pertama',
      'Saunas, hot tubs, and hot yoga — a raised core temperature is not advised',
      'Holding your breath while lifting',
    ],
    tandaBerhenti: [
      'Vaginal bleeding',
      'Abdominal pain or persistent regular contractions',
      'Fluid leaking from the vagina',
      'Breathlessness before any exertion',
      'Chest pain',
      'Vertigo or near-fainting that persists',
      'Severe headache',
      'Muscle weakness affecting your balance',
      'Calf pain or swelling',
      'Reduced fetal movement',
    ],
    kontraindikasiMutlak: [
      'Significant heart or lung disease',
      'A weak or sutured cervix',
      'A multiple pregnancy with risk of preterm birth',
      'Persistent bleeding in the second or third trimester',
      'Placenta praevia after 26 weeks',
      'A history of, or threatened, preterm labour in this pregnancy',
      'Premature rupture of membranes',
      'Pre-eclampsia or uncontrolled hypertension in pregnancy',
      'Severe anaemia',
    ],
  }
}

export const DISCLAIMER_HAMIL =
  'This guidance is general and applies to pregnancies WITHOUT complications. Your own pregnancy needs to be assessed by the midwife or doctor caring for you before you start or continue a training programme, particularly if any of the contraindications above apply. If any of the stop signs appear, stop the activity and contact a health professional.'

// ═══ 5. FISIOLOGI KURSI RODA ════════════════════════════════════════════════

export interface ZonaDorong {
  z: number
  nama: string
  pctHrPuncak: [number, number]
  tujuan: string
}

/**
 * Zona untuk olahraga lengan atas.
 *
 * Denyut jantung puncak pada olahraga lengan lebih RENDAH daripada pada
 * olahraga kaki — massa otot yang bekerja lebih kecil — sehingga memakai
 * HRmaks hasil tes berlari maupun rumus 220−usia akan membuat setiap zona
 * terbaca terlalu ringan. Zona di sini dinyatakan terhadap denyut puncak yang
 * diamati SAAT MENDORONG, bukan terhadap HRmaks umum.
 */
export const ZONA_DORONG: ZonaDorong[] = [
  { z: 1, nama: 'Pemulihan', pctHrPuncak: [50, 60], tujuan: 'Easy pushing that keeps the blood moving.' },
  { z: 2, nama: 'Ketahanan', pctHrPuncak: [60, 70], tujuan: 'The aerobic base. Most of your weekly volume belongs here.' },
  { z: 3, nama: 'Tempo', pctHrPuncak: [70, 80], tujuan: 'Moderate — hard but controlled.' },
  { z: 4, nama: 'Ambang', pctHrPuncak: [80, 90], tujuan: '5–10 minute intervals to raise the threshold.' },
  { z: 5, nama: 'Maksimal', pctHrPuncak: [90, 100], tujuan: 'Sprints and short intervals.' },
]

export interface PanduanKursiRoda {
  zona: { z: number; nama: string; dari: number; sampai: number; tujuan: string }[]
  bahu: { judul: string; isi: string }[]
  catatan: string[]
}

export function panduanKursiRoda(hrPuncakDorong: number): PanduanKursiRoda {
  const zona = ZONA_DORONG.map((z) => ({
    z: z.z, nama: z.nama, tujuan: z.tujuan,
    dari: Math.round((hrPuncakDorong * z.pctHrPuncak[0]) / 100),
    sampai: Math.round((hrPuncakDorong * z.pctHrPuncak[1]) / 100),
  }))

  return {
    zona,
    bahu: [
      {
        judul: 'The shoulder carries everything here',
        isi: 'For wheelchair users the shoulder is used for transfers, propulsion, and bearing weight — work that is shared with the legs in everyone else. Shoulder pain is therefore very common, and protecting the shoulder is not an add-on but a core part of the programme.',
      },
      {
        judul: 'Train the pulling muscles, not only the pushing ones',
        isi: 'Pushing trains the chest and front of the shoulder. If that is all you train, the imbalance grows and the shoulder is pulled further forward. Pulling work — rows, face pulls, scapular retraction — is the counterweight that matters most.',
      },
      {
        judul: 'Teknik mendorong menentukan beban sendi',
        isi: 'Long, rhythmic strokes with the hand swinging low on the return load the shoulder less than short, fast, repeated pushes. Fewer strokes, each one longer, is the right target.',
      },
      {
        judul: 'Rotator cuff and chest',
        isi: 'Strengthen the external rotators and stretch the chest regularly. The pattern of a shortened chest with weakened back muscles develops faster in wheelchair users than in others.',
      },
    ],
    catatan: [
      'Peak heart rate in arm exercise is lower than in leg exercise. Using 220−age will make the zones read too easy — use the peak rate you actually observe when pushing hard.',
      'With a spinal cord injury at chest level or above, heart rate may not rise as it should because the nerve supply to the heart is affected. Where that is the case, heart rate CANNOT be used to gauge intensity — use a rating of perceived exertion (6–20 or 1–10) and the talk test.',
      'Temperature regulation can also be impaired in a high spinal cord injury, raising the risk of overheating. Train somewhere cool, drink enough, and use active cooling.',
      'Watch for autonomic dysreflexia in injuries at T6 or above: sudden severe headache, facial flushing, sweating above the level of injury, and a surge in blood pressure. This is a medical emergency — stop the activity, sit upright, and get help.',
      'Check the skin over weight-bearing areas regularly, especially after increasing training volume.',
    ],
  }
}
