import { TAU_KEBUGARAN, TAU_KELELAHAN } from './analisisPro'

// ─────────────────────────────────────────────────────────────────────────────
// Aturan main angka-angka kesehatan.
//
// MENGAPA BERKAS INI ADA. Aplikasi ini menampilkan belasan angka — Recovery,
// Exertion, Fit, Tired, Fresh, Body Battery, Stress — dan tidak satu pun dari
// angka itu menjelaskan dirinya sendiri di tempat ia muncul. Pemakainya bertanya
// "kenapa nilai fatigue tidak berubah", dan pertanyaan itu benar: angka yang
// tidak dapat diterangkan sama saja dengan angka yang tidak dapat dipercaya.
//
// SEBUAH PERMAINAN PUNYA ATURAN YANG DAPAT DIBACA. Itulah yang membedakan
// permainan dari mesin judi: pemain tahu apa yang menaikkan angkanya, apa yang
// menurunkannya, dan berapa lama. Berkas ini menuliskan aturan itu untuk tiap
// angka — masukannya, rumusnya dalam kalimat, apa yang menggerakkannya ke atas
// dan ke bawah, seberapa cepat, dan satu tindakan yang benar-benar dapat
// dikerjakan hari ini.
//
// TETAPAN DIIMPOR, TIDAK DISALIN. τ kebugaran dan τ kelelahan diambil dari mesin
// hitungnya sendiri. Bila suatu hari tetapannya diubah, halaman penjelas ini
// ikut berubah — penjelasan yang menyimpang dari mesinnya lebih berbahaya
// daripada tidak ada penjelasan sama sekali.
//
// YANG SENGAJA TIDAK ADA DI SINI: tidak ada angka gabungan "skor kesehatan",
// tidak ada lencana, tidak ada rangkaian yang menghukum bila terputus, dan tidak
// ada imbalan yang muncul tak terduga. Semuanya membuat orang mengejar angkanya
// alih-alih keadaannya, dan pada aplikasi kesehatan itu merugikan.
// ─────────────────────────────────────────────────────────────────────────────

export interface Indikator {
  id: string
  nama: string
  satuan: string
  /** Warna pengenal — sama di seluruh aplikasi. */
  warna: string
  /** Satu kalimat: angka ini sebenarnya mengukur apa. */
  arti: string
  /** Data yang benar-benar dibaca. Bila kosong, angkanya tidak muncul. */
  masukan: string[]
  /** Rumusnya dalam kalimat, bukan lambang. */
  rumus: string
  /** Yang menaikkannya, beserta kecepatannya. */
  naik: string[]
  /** Yang menurunkannya, beserta kecepatannya. */
  turun: string[]
  /** Seberapa sering angkanya benar-benar berubah — sumber salah paham terbesar. */
  irama: string
  /** Batasnya. Ditulis di tempat angkanya dijelaskan, bukan di catatan kaki. */
  batas: string
  /** Satu tindakan yang dapat dikerjakan hari ini. */
  tindakan: string
}

export const INDIKATOR: Indikator[] = [
  {
    id: 'exertion',
    nama: 'Exertion',
    satuan: 'points per session',
    warna: '#f59e0b',
    arti:
      'How much a single session actually cost you — not how long it lasted and not how far you went, but how hard your heart worked and for how long.',
    masukan: [
      'The heart-rate trace of the session (each sample counts for the gap until the next one)',
      'Your resting heart rate and maximum heart rate — these set the scale',
      'Your sex, because the weighting curve differs',
      'If there is no heart-rate trace: average heart rate and duration',
      'If there is neither: your own rating of effort (RPE), which is coarser and is labelled as such',
    ],
    rumus:
      'For every minute, your heart rate is converted to a fraction of your heart-rate reserve, then weighted by an exponential curve so that hard minutes count far more than easy ones. The weighted minutes are added up. Sixty easy minutes lands near 50; a hard hour can pass 200.',
    naik: [
      'Longer sessions, at the same intensity — the relationship is roughly linear',
      'Higher intensity at the same duration — this rises much faster than linearly, because of the exponential weighting',
      'A lower resting heart rate raises the score for the same session, since the same beats now sit higher in your reserve',
    ],
    turun: [
      'It does not fall. Exertion belongs to one session and is fixed once that session ends',
      'What changes is what it feeds: Tired and Fit',
    ],
    irama: 'Computed once, when the session is saved. It never moves afterwards.',
    batas:
      'A session with no heart rate is scored from your own effort rating and is genuinely rougher. Strength work is understated by any heart-rate method — a heavy set costs you far more than your heart rate admits.',
    tindakan:
      'If a session you logged shows a suspiciously low number, open it and check whether the heart-rate trace was actually imported. That is almost always the reason.',
  },
  {
    id: 'tired',
    nama: 'Tired (fatigue)',
    satuan: 'load units',
    warna: '#f87171',
    arti:
      'The training you are still carrying from the last week or so — the part that has not been absorbed yet.',
    masukan: ['Every session Exertion score from roughly the last six weeks', 'The time elapsed since each of them'],
    rumus:
      `An exponential moving average of daily Exertion with a time constant of ${TAU_KELELAHAN} days. Each session's contribution shrinks by a factor of e every ${TAU_KELELAHAN} days: after ${TAU_KELELAHAN} days about 37% of it is left, after two weeks about 14%, after a month almost nothing.`,
    naik: [
      'Immediately after any session, in proportion to its Exertion',
      'Two hard sessions in the same week stack, because the first has not decayed yet',
    ],
    turun: [
      `By itself, with time, and only with time — about 13% of what remains per day at a ${TAU_KELELAHAN}-day time constant`,
      'Nothing you eat, drink, or take makes this number fall faster. Rest is the only input',
    ],
    irama:
      'It moves CONTINUOUSLY — the current value is recomputed against the actual clock, not against midnight. Five hours of rest does change it, though only slightly: from a fatigue of 60 you would expect roughly half a point an hour. If it looks frozen, the likeliest reason is that the screen has been open a long time without refreshing.',
    batas:
      'It only knows about training. A night of bad sleep, a fever, an exam week, or a long flight all leave you genuinely tired and this number will not notice any of them.',
    tindakan:
      'Do not chase a low number. Fatigue is the price of training, not a fault. What matters is whether it is falling on the days you planned to rest.',
  },
  {
    id: 'fit',
    nama: 'Fit (fitness)',
    satuan: 'load units',
    warna: '#60a5fa',
    arti:
      'The training you have absorbed and can now build on — the slow accumulation of the last month and a half.',
    masukan: ['Every session Exertion score from roughly the last eight months', 'The time elapsed since each of them'],
    rumus:
      `The same exponential moving average as Tired, but with a time constant of ${TAU_KEBUGARAN} days instead of ${TAU_KELELAHAN}. Six times slower to build, and six times slower to lose.`,
    naik: [
      'Slowly, by repeating sessions. One hard session barely moves it',
      'Consistency beats intensity here: four moderate sessions a week raise it more than one heroic session',
    ],
    turun: [
      `Slowly. After a week of complete rest you keep about 85% of it; after a month, about half`,
      'This asymmetry is the whole point of a taper: rest sheds fatigue fast and fitness slowly, so what is left is form',
    ],
    irama: 'Continuously, like Tired — but the daily movement is small enough that day-to-day it looks flat. That is correct.',
    batas:
      'It measures your training load, not your physiology. Someone who trains a lot inefficiently will show a high number. Read it together with VO₂max trend and resting heart rate, which are measurements rather than a model.',
    tindakan:
      'If you have been ill or away for a week, do not try to make it back up. Fitness lost in a week returns in a week; a session taken to "catch up" costs more than it gives.',
  },
  {
    id: 'fresh',
    nama: 'Fresh (form)',
    satuan: 'load units',
    warna: '#34d399',
    arti:
      'Whether you are carrying more absorbed training than unabsorbed fatigue right now. This is the number that says how ready you are today.',
    masukan: ['Fit', 'Tired'],
    rumus: 'Fit minus Tired. Nothing else.',
    naik: ['Rest — because Tired falls six times faster than Fit', 'Weeks of consistent training, which raise Fit'],
    turun: ['Any hard session, immediately', 'A block of heavy training, deliberately — building requires a negative period'],
    irama: 'Continuously, and it is the fastest-moving of the three because it inherits the movement of Tired.',
    batas:
      'Positive is not "good" and negative is not "bad". A negative value in a build block is exactly what should happen. It only becomes a warning when it is negative for many weeks with no planned rest, or when it goes deeply negative while your fitness stops rising.',
    tindakan:
      'Read the direction, not the sign. Rising for several days means you are absorbing; falling for several weeks with flat fitness means the load is not being paid for.',
  },
  {
    id: 'recovery',
    nama: 'Recovery',
    satuan: '%',
    warna: '#22d3ee',
    arti:
      'How well your body handled the night — read from your nervous system rather than from your training log.',
    masukan: [
      'Overnight heart-rate variability, compared against YOUR OWN baseline of the previous weeks',
      'Resting heart rate against the same personal baseline',
      'Hours and continuity of sleep',
      'Respiratory rate, when the device records it',
    ],
    rumus:
      'Each input is expressed as a distance from your own recent baseline, not from a population standard. There is no universal HRV that means "recovered" — a value of 40 ms may be excellent for one person and a warning for another. Missing inputs are left out rather than replaced by an assumed value.',
    naik: [
      'Sleep, both length and continuity — the single largest input',
      'Easy days and complete rest days',
      'A stable routine: the baseline itself becomes tighter and more informative',
    ],
    turun: [
      'Hard training the day before, especially in the evening',
      'Alcohol — one of the most reliable and largest overnight HRV suppressors there is',
      'Illness, often a day BEFORE you feel anything',
      'Late meals, heat, dehydration, an unfamiliar bed, and stress',
    ],
    irama: 'Once a day, on waking. It does not change during the day, and it is not supposed to.',
    batas:
      'It needs at least a fortnight of nights before the baseline means anything. Before that, the app should say so rather than show a confident percentage.',
    tindakan:
      'A single low morning is noise. Two or three in a row is a message: cut the intensity, keep the movement, and go to bed earlier tonight rather than trying to make up for it tomorrow.',
  },
  {
    id: 'battery',
    nama: 'Body Battery',
    satuan: '0-100',
    warna: '#a78bfa',
    arti:
      'A running estimate through the day of how much you have left, filled by rest and drained by effort and stress.',
    masukan: ['Continuous heart rate through the day', 'Sleep periods, which fill it faster', 'Your resting and maximum heart rate'],
    rumus:
      'For every stretch of time, your heart rate is placed on your heart-rate reserve. Below about 18% of reserve the battery charges — fastest asleep, more slowly at rest. Above it, the battery drains, and the drain grows with the SQUARE of how far above you are: a very hard hour costs far more than twice a moderately hard hour.',
    naik: ['Sleep, by far the fastest', 'Genuinely sitting still — not scrolling while tense, which shows up as a raised heart rate'],
    turun: ['Any exertion', 'Stress, which the heart cannot distinguish from exertion — and neither can this number'],
    irama: 'Continuously through the day, as long as heart-rate data keeps arriving.',
    batas:
      'A gap in heart-rate data is a gap in the battery. It also cannot tell an argument from a set of squats — both look like a raised heart rate at rest.',
    tindakan:
      'Look at what drained it, not just how empty it is. If it fell hard during hours you were sitting at a desk, that is a stress finding, not a training one.',
  },
]

/**
 * Rencana yang menjawab "lalu saya harus apa" — dan sengaja dibuat kecil.
 *
 * Rencana yang panjang tidak dikerjakan. Yang ditulis di sini adalah urutan
 * PRIORITAS, sehingga bila hanya satu hal yang sanggup dikerjakan hari ini,
 * yang dipilih adalah yang paling menentukan.
 */
export interface LangkahRencana {
  urutan: number
  judul: string
  kenapa: string
  ukuran: string
}

export const RENCANA: LangkahRencana[] = [
  {
    urutan: 1,
    judul: 'Fix the inputs before reading the outputs',
    kenapa:
      'Every number here is only as good as what feeds it. Sessions with no heart-rate trace, a resting heart rate left at the default 60, and an age that was never entered will quietly distort all six numbers at once — and they will still look like confident numbers.',
    ukuran: 'Your profile has your real age, sex, height, weight, and resting heart rate; your last five sessions each carry a heart-rate trace.',
  },
  {
    urutan: 2,
    judul: 'Collect fourteen nights before you judge anything',
    kenapa:
      'Recovery, and every personal band drawn on these charts, is measured against your own baseline. With fewer than about fourteen nights there is no baseline — only a number pretending to be one.',
    ukuran: 'Fourteen nights of sleep and overnight heart rate recorded.',
  },
  {
    urutan: 3,
    judul: 'Make sleep the first lever, not the last',
    kenapa:
      'Of everything you can change, sleep moves Recovery, Body Battery, and resting heart rate more than any training decision, any supplement, and any diet change. It is also the cheapest.',
    ukuran: 'A fixed wake time, seven days a week, and lights out early enough for seven to nine hours.',
  },
  {
    urutan: 4,
    judul: 'Keep most of your training easy',
    kenapa:
      'Fit rises with total absorbed load, and load absorbed at low intensity costs far less fatigue than the same load taken hard. Around 80% of your weekly minutes in zones 1 and 2 is the pattern that raises Fit without burying you in Tired.',
    ukuran: 'The training-load focus panel shows most of your minutes in the low-aerobic band.',
  },
  {
    urutan: 5,
    judul: 'Let Fresh go negative on purpose, then let it come back',
    kenapa:
      'Building requires accumulating more fatigue than you clear; recovering requires the reverse. Three weeks of building followed by one easier week produces the rise-and-fall pattern these numbers are designed to show. Staying permanently positive means you are maintaining, not building.',
    ukuran: 'A visible saw-tooth in the 30-day Fresh chart, not a flat line.',
  },
  {
    urutan: 6,
    judul: 'React to trends, never to a single day',
    kenapa:
      'Every one of these numbers has real day-to-day noise. Acting on one bad morning is how people abandon a plan that was working. Three days in the same direction is a signal; one day is weather.',
    ukuran: 'You changed your plan only after a run of days, and you can say which run it was.',
  },
]
