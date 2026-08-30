import type { AngkaKlinis } from './angkaKlinis'

// ─────────────────────────────────────────────────────────────────────────────
// Rentang rujukan untuk tanda tubuh — dengan populasinya disebut.
//
// APA YANG SALAH DENGAN "BAIK / CUKUP / KURANG". Label seperti itu menyembunyikan
// tiga hal sekaligus, dan ketiganya menentukan apakah angkanya berarti:
//
//   1. TERHADAP SIAPA. Denyut istirahat 48 bpm adalah tanda kebugaran pada
//      pelari, dan tanda gangguan hantaran jantung pada orang berusia 75 tahun
//      yang memakai penyekat beta. Satu label untuk keduanya keliru pada salah
//      satunya, dan tampilan itu tidak pernah memberi tahu yang mana.
//
//   2. SEBERAPA TIDAK PASTI ALATNYA. Oksimeter pada jam tangan memiliki galat
//      beberapa persen, sehingga bacaan 94% dapat berarti 91% maupun 97%.
//      Menampilkannya sebagai satu angka bulat memberi kesan ketepatan yang
//      tidak dimiliki alatnya.
//
//   3. SEBERAPA BESAR RAGAM HARIANNYA. Inilah yang paling sering diabaikan.
//      HRV berayun belasan sampai dua puluhan persen dari hari ke hari pada
//      orang yang sama dan sehat. Menampilkan panah turun untuk selisih
//      sebesar itu bukan sekadar tidak berguna — ia mengajari orang menafsirkan
//      derau sebagai sinyal, lalu mengubah latihan bahkan obatnya berdasarkan
//      derau tersebut.
//
// TENTANG SUMBER. Angka-angka di bawah ini adalah NILAI LAZIM yang dipakai
// dalam ajaran klinis dan fisiologi olahraga baku, bukan kutipan dari satu
// penelitian tertentu, dan ditulis apa adanya sebagai demikian. Mencantumkan
// nama penulis dan tahun untuk angka yang tidak benar-benar ditelusuri akan
// memberi kesan ketelitian yang tidak ada — dan itu justru kebalikan dari
// tujuan seluruh berkas ini.
//
// PERBANDINGAN YANG PALING BERGUNA BUKAN TERHADAP POPULASI. Untuk HRV dan
// denyut istirahat, ragam antarorang jauh lebih besar daripada ragam dalam
// satu orang. Karena itu yang ditampilkan lebih dahulu adalah perbandingan
// terhadap NILAI DASAR ANDA SENDIRI, dan rentang populasi hanya sebagai
// keterangan tambahan.
// ─────────────────────────────────────────────────────────────────────────────

const SUMBER_LAZIM = 'values in standard clinical teaching and exercise physiology, not a citation of any single study'

/** Simpangan baku dalam satu orang dari hari ke hari, dipakai menghitung SDC. */
interface Ragam {
  /** Perkiraan simpangan baku harian dalam diri sendiri. */
  sdHarian: number
  keterangan: string
}

/**
 * Perubahan terkecil yang layak disebut nyata.
 *
 * Memakai kaidah baku pengukuran berulang: selisih dua pengukuran memiliki
 * simpangan baku √2 kali simpangan baku satu pengukuran, dan batas keyakinan
 * 95% berada pada 1,96 kali angka itu. Hasilnya sekitar 2,77 × sd.
 *
 * Angka inilah yang memutuskan boleh tidaknya sebuah panah ditampilkan.
 */
export function sdc(sdHarian: number): number {
  return Math.round(2.77 * sdHarian * 10) / 10
}

export interface BahanTubuh {
  restingHr?: number
  hrvMs?: number
  spo2Pct?: number
  systolic?: number
  diastolic?: number
  /** Rerata nilai dasar pemakai sendiri, bila ada cukup riwayat. */
  dasarRestingHr?: number
  dasarHrvMs?: number
  /** Usia dan jenis kelamin untuk memilih rentang yang tepat. */
  usia?: number
  sex?: 'M' | 'F'
}

const RAGAM_RHR: Ragam = {
  sdHarian: 3,
  keterangan: 'Resting heart rate measured by a watch across the night swings by a few beats from night to night in the same healthy person, depending on room temperature, when you last ate, alcohol, and sleep quality.',
}

const RAGAM_HRV: Ragam = {
  sdHarian: 8,
  keterangan: 'HRV is the most volatile of all the body signals. Night-to-night variation in healthy people commonly runs to ten or twenty per cent of its own value, so a one-night difference is almost always noise.',
}

export function auditDenyutIstirahat(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.restingHr !== 'number' || !Number.isFinite(b.restingHr)) return null
  const batas = sdc(RAGAM_RHR.sdHarian)
  const dasar = b.dasarRestingHr

  return {
    label: 'Resting heart rate',
    nilai: String(Math.round(b.restingHr)),
    satuan: 'bpm',
    tingkat: 'terukur',
    arti: 'The lowest heart rate recorded while the body is genuinely still, usually during the second half of the night.',
    masukan: [
      { nama: 'Latest reading', nilai: `${Math.round(b.restingHr)} bpm`, sumber: 'a watch or a manual entry' },
      ...(dasar ? [{ nama: 'Your own baseline', nilai: `${Math.round(dasar)} bpm`, sumber: 'the average of your history' }] : []),
    ],
    ketidakpastian: {
      sdc: `A difference under ${batas} bpm against your own baseline is not worth interpreting.`,
      dasar: `${RAGAM_RHR.keterangan} The ${batas} bpm threshold is 2.77 × the daily standard deviation of ${RAGAM_RHR.sdHarian} bpm — the standard rule for separating real change from measurement variation.`,
    },
    rujukan: {
      rentang: '60–100 bpm in adults; 40–60 bpm is common in endurance-trained people',
      populasi: 'general adults; the lower range applies to those training endurance regularly',
      sumber: SUMBER_LAZIM,
    },
    tidakDipengaruhi: [
      "Fitness from a single session. Resting heart rate reflects adaptation over weeks, not yesterday's workout.",
      'Daily step count.',
    ],
    yangMenggerakkan: [
      'Regular endurance training — lowers it slowly over weeks to months.',
      'Alcohol the night before, fever, dehydration and short sleep — raise it temporarily.',
      'Medicines: beta blockers lower it; beta-agonist asthma inhalers and decongestants raise it.',
      'Room temperature and when you last ate.',
    ],
    batasan: [
      'The 60–100 bpm range comes from what is common, not from outcome data. A value of 95 bpm sits inside that range and still carries more risk than 60 bpm.',
      'This number CANNOT BE USED TO COMPARE FITNESS BETWEEN PEOPLE. Part of it is inherited; there are fit people at 65 and unfit people at 55.',
      'If you take a beta blocker or another cardiac medicine, everything above changes and should be discussed with the doctor who prescribed it.',
      'A resting heart rate persistently above 100 bpm, or below 40 bpm with dizziness or fainting, is a reason to get checked — not a reason to adjust training.',
    ],
  }
}

export function auditHrv(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.hrvMs !== 'number' || !Number.isFinite(b.hrvMs)) return null
  const batas = sdc(RAGAM_HRV.sdHarian)

  return {
    label: 'HRV',
    nilai: String(Math.round(b.hrvMs)),
    satuan: 'ms',
    tingkat: 'terukur',
    arti: 'The variation in the interval between heartbeats. It reflects how much parasympathetic influence — the calming branch of the nervous system — was present at the time of measurement.',
    skala: 'Values differ enormously between people and depend heavily on age. THE ONLY MEANINGFUL COMPARISON IS AGAINST YOUR OWN HISTORY; comparing HRV with another person means almost nothing.',
    masukan: [
      { nama: 'Latest reading', nilai: `${Math.round(b.hrvMs)} ms`, sumber: 'a watch' },
      ...(b.dasarHrvMs ? [{ nama: 'Your own baseline', nilai: `${Math.round(b.dasarHrvMs)} ms`, sumber: 'the average of your history' }] : []),
    ],
    ketidakpastian: {
      sdc: `A difference under roughly ${batas} ms against your own baseline is noise, not change.`,
      dasar: `${RAGAM_HRV.keterangan} That is why one night is never enough: what is worth reading is the seven-day average, not a single night's number.`,
    },
    rujukan: {
      rentang: 'Very wide, and falling with age; tens of milliseconds in young adults, far lower in older people. There is no single range that applies to everyone.',
      populasi: 'depends on age, sex, measurement method and device — a watch value cannot be equated with a laboratory measurement',
      sumber: SUMBER_LAZIM,
    },
    tidakDipengaruhi: [
      'Daily steps and calories.',
      'Body weight in the short term.',
    ],
    yangMenggerakkan: [
      "Alcohol — lowers it markedly, and is often the single largest visible effect in an individual's data.",
      'Hard training the day before, illness, fever and short sleep — lower it temporarily.',
      'A heavy meal close to bedtime, and a hot room.',
      'Mental load and anxiety.',
      'Regular endurance training — raises it slowly over months.',
    ],
    batasan: [
      'A SINGLE NIGHT MEANS ALMOST NOTHING. What means something is the direction of the seven-day average against the monthly average.',
      'A watch value depends on how the device computes it and which part of the night it samples; comparing numbers from two different brands is not valid.',
      'A low value does NOT mean illness, and a high one does NOT mean health. There are healthy people whose values are low for life.',
      'It cannot be used to diagnose anything. It is only a rough marker of autonomic state on that night.',
    ],
  }
}

export function auditSpo2(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.spo2Pct !== 'number' || !Number.isFinite(b.spo2Pct)) return null
  const v = Math.round(b.spo2Pct)

  return {
    label: 'Oxygen saturation',
    nilai: String(v),
    satuan: '%',
    tingkat: 'terukur',
    arti: 'An estimate of the percentage of haemoglobin carrying oxygen, read from how light is absorbed through the skin.',
    masukan: [{ nama: 'Latest reading', nilai: `${v}%`, sumber: 'a watch oximeter or a fingertip device' }],
    ketidakpastian: {
      sdc: `A reading of ${v}% is best read as roughly ${v - 3}% to ${v + 3}%, and no more precisely than that.`,
      dasar: 'A pulse oximeter measures light passing through tissue, not blood oxygen directly. Its typical error is a few per cent, and larger on consumer devices than on hospital ones.',
    },
    rujukan: {
      rentang: '95–100% in healthy people at low altitude',
      populasi: 'healthy adults without lung or heart disease, at close to sea level',
      sumber: SUMBER_LAZIM,
    },
    tidakDipengaruhi: ['Fitness and training.', 'Sleep, unless there is sleep apnoea.'],
    yangMenggerakkan: [
      'Altitude — it falls legitimately at height.',
      'Lung and heart disease.',
      'Sleep apnoea — drops it repeatedly through the night.',
    ],
    batasan: [
      'ACCURACY IS WORSE ON DARKER SKIN, and the bias is towards READING TOO HIGH. This is a long-documented, clinically meaningful device error, because low oxygen can be missed in exactly the people it most needs detecting in.',
      'Nail polish, cold hands, movement and a loose device all make a reading unreliable.',
      'Consumer devices are NOT DESIGNED for medical decisions. A surprisingly low reading should be repeated with warm hands and a well-fitted device before drawing any conclusion.',
      'Genuine breathlessness with a normal-looking saturation still needs assessment — symptoms come before numbers.',
    ],
  }
}

export function auditTekananDarah(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.systolic !== 'number' || typeof b.diastolic !== 'number') return null
  const s = Math.round(b.systolic), d = Math.round(b.diastolic)

  return {
    label: 'Blood pressure',
    nilai: `${s}/${d}`,
    satuan: 'mmHg',
    tingkat: 'terukur',
    arti: 'The pressure in the arteries when the heart pumps and when it fills.',
    masukan: [{ nama: 'Latest reading', nilai: `${s}/${d} mmHg`, sumber: 'a blood-pressure monitor' }],
    ketidakpastian: {
      sdc: 'A difference under roughly 8 mmHg between two measurements is not yet worth interpreting.',
      dasar: 'Blood pressure swings through the day and between measurements. That is why a diagnosis is never made from a single reading.',
    },
    rujukan: {
      rentang: 'Optimal below 120/80 mmHg; high at 140/90 mmHg or above measured in a clinic, and 135/85 mmHg or above measured at home',
      populasi: 'adults; the home threshold is deliberately lower because home readings average lower than clinic ones',
      sumber: 'PERKI 2021 hypertension guideline and standard clinical teaching',
    },
    tidakDipengaruhi: ['Fitness in the short term.', 'A single training session.'],
    yangMenggerakkan: [
      'Salt, body weight, alcohol and inactivity.',
      'Pain, anxiety, a full bladder and talking during the measurement — all raise it temporarily.',
      'Coffee and smoking in the last 30 minutes.',
      'Medicines: antihypertensives lower it; decongestants and NSAIDs raise it.',
    ],
    batasan: [
      'A SINGLE READING ESTABLISHES NOTHING. Diagnosis needs repeated measurements on different days, preferably at home.',
      'Technique decides the result: sit supported for five minutes first, feet flat on the floor, arm supported at heart height, a cuff sized to the arm, and no talking. A cuff that is too small reads too high.',
      'A blood pressure of 180/110 mmHg or above, especially with chest pain, breathlessness, severe headache, visual disturbance or one-sided weakness, is a reason to seek help immediately — not a reason to repeat the measurement.',
    ],
  }
}

/** Seluruh angka tubuh yang datanya tersedia, siap ditampilkan. */
export function auditTubuh(b: BahanTubuh): AngkaKlinis[] {
  return [
    auditDenyutIstirahat(b),
    auditHrv(b),
    auditTekananDarah(b),
    auditSpo2(b),
  ].filter((x): x is AngkaKlinis => x !== null)
}
