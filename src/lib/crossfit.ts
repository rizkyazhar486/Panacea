// ─────────────────────────────────────────────────────────────────────────────
// CrossFit — format latihan, benchmark, penskalaan dan batas keamanan.
//
// Halaman ini mengajarkan FORMAT-nya, bukan menyuruh Anda menyelesaikan angka
// tertentu. Alasannya medis, bukan gaya bahasa: format CrossFit yang bervolume
// tinggi dan berbasis waktu adalah salah satu penyebab rabdomiolisis olahraga
// yang paling sering dilaporkan pada pemula, karena format "sebanyak mungkin
// dalam 20 menit" secara harfiah memberi hadiah pada mengabaikan sinyal berhenti.
// Karena itu penskalaan dan batas berhenti ditulis sejajar dengan workout-nya,
// bukan sebagai catatan kaki.
//
// Soal nama: "Girls" dan "Hero WOD" adalah benchmark bernama milik CrossFit
// Inc. yang sudah lama beredar umum. Yang dimuat di sini adalah daftar gerakan
// dan repetisinya — fakta yang bisa diverifikasi — bukan salinan materi kursus
// berbayar mereka.
//
// Hero WOD dinamai dari anggota militer dan petugas penyelamat yang gugur.
// Halaman ini menyebutkan itu, karena memakai namanya sebagai sekadar "workout
// berat" tanpa tahu asalnya adalah hal yang pantas dihindari.
// ─────────────────────────────────────────────────────────────────────────────

export interface Format {
  id: string
  nama: string
  kepanjangan: string
  singkat: string
  caraKerja: string
  bagusUntuk: string
  jebakan: string
  contoh: string
}

export const FORMAT: Format[] = [
  {
    id: 'amrap',
    nama: 'AMRAP',
    kepanjangan: 'As Many Rounds/Reps As Possible',
    singkat: 'Fixed time, as much work as possible.',
    caraKerja: 'The clock is fixed (say 20 minutes). You cycle through a sequence of movements continuously and count how many rounds plus reps you complete. Your score is the number of rounds.',
    bagusUntuk: 'It teaches pacing. Because the clock never stops, an AMRAP shows you honestly whether you started too fast.',
    jebakan: 'It easily turns into a race against the person next to you. A first round that is too fast almost always lowers the final total rather than raising it.',
    contoh: 'Cindy — 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats.',
  },
  {
    id: 'fortime',
    nama: 'For Time',
    kepanjangan: 'Finish as fast as possible',
    singkat: 'Fixed work, time as the score.',
    caraKerja: 'The number of reps is set. Your score is how long you take to finish them.',
    bagusUntuk: 'A clean comparison over time — same load, same reps, so the time actually means something.',
    jebakan: 'The format most often linked with injury in beginners, because broken technique still "counts" as long as the rep is completed.',
    contoh: 'Fran — 21-15-9 thruster & pull-up, as fast as possible.',
  },
  {
    id: 'emom',
    nama: 'EMOM',
    kepanjangan: 'Every Minute On the Minute',
    singkat: 'Work at the top of each minute, rest for what is left.',
    caraKerja: 'Each minute you perform a set number of reps, then rest until the next minute begins. The faster you finish, the longer you rest.',
    bagusUntuk: 'The SAFEST format for beginners. The rest is structured, so technique does not collapse, and intensity can be dialled in precisely.',
    jebakan: 'If the reps are so many that only seconds of rest remain, an EMOM becomes continuous work and loses the point of the format.',
    contoh: '12-minute EMOM: odd minutes 10 kettlebell swings, even minutes 8 burpees.',
  },
  {
    id: 'tabata',
    nama: 'Tabata',
    kepanjangan: '20 seconds work / 10 seconds rest × 8',
    singkat: 'Four minutes of very short intervals.',
    caraKerja: 'Eight rounds of 20 seconds all-out work and 10 seconds rest, four minutes per movement. Your score is the LOWEST rep count of the eight rounds.',
    bagusUntuk: 'Very little time required. The "lowest round" score is clever: it punishes an opening burst you cannot sustain.',
    jebakan: 'The original Tabata protocol (Tabata 1996) used a cycle ergometer at roughly 170% VO₂max — the bodyweight version is not the same thing and should not be claimed to give the same results.',
    contoh: 'Tabata air squat, then Tabata push-up.',
  },
  {
    id: 'chipper',
    nama: 'Chipper',
    kepanjangan: 'A long list, worked through once',
    singkat: 'Many movements, none repeated.',
    caraKerja: 'A list of movements with large rep counts, worked through in order to the end, with no rounds.',
    bagusUntuk: 'Mental endurance and movement variety in a single session.',
    jebakan: 'The total volume is large. A chipper is the format most in need of scaling for a beginner — halve every rep count first.',
    contoh: '100 double-under, 80 sit-up, 60 lunge, 40 push-up, 20 burpee.',
  },
  {
    id: 'couplet',
    nama: 'Couplet & Triplet',
    kepanjangan: 'Two or three movements alternating',
    singkat: 'The most common structure in CrossFit.',
    caraKerja: 'Two (couplet) or three (triplet) movements alternated. They are usually paired so different muscles work, letting one movement "rest" the other.',
    bagusUntuk: 'High intensity without one muscle group giving out before the cardiovascular system does.',
    jebakan: 'A bad pairing (say two pulling movements) ends the session through grip failure rather than breathing.',
    contoh: 'Helen (triplet) — 3 rounds: 400 m run, 21 kettlebell swings, 12 pull-ups.',
  },
  {
    id: 'ladder',
    nama: 'Ladder',
    kepanjangan: 'Reps climbing or descending in steps',
    singkat: 'The numbers change every round.',
    caraKerja: 'Reps go up (1, 2, 3, …) or down (21-15-9). A descending ladder feels lighter precisely as you get more tired.',
    bagusUntuk: 'It keeps the session finishable as fatigue accumulates.',
    jebakan: 'An ascending ladder with no time cap can continue well past the point where technique breaks.',
    contoh: '21-15-9, and "death by burpee" (add one rep each minute until you fail).',
  },
  {
    id: 'hyrox',
    nama: 'HYROX',
    kepanjangan: 'A standardised fitness race',
    singkat: '8 × 1 km runs alternating with 8 stations.',
    caraKerja: 'Unlike CrossFit, the order is THE SAME at every race in the world — run 1 km, one station, repeat eight times. The stations are ski erg, sled push, sled pull, burpee broad jump, row, farmers carry, sandbag lunge, wall balls.',
    bagusUntuk: 'People who want a fair comparison across time and across cities, and who prefer endurance to technical barbell work.',
    jebakan: 'The running adds up to eight kilometres. Many people train the stations and forget that this race is mostly running.',
    contoh: 'Half simulation: 4 × (1 km run + one station).',
  },
]

/**
 * Setelan jam untuk sesi ini.
 *
 *   amrap    hitung mundur dari `menit`; skornya jumlah ronde.
 *   fortime  hitung maju sampai dihentikan; skornya waktu. `batas` adalah
 *            batas waktu keras (time cap) bila ada.
 *   emom     hitung maju, menandai tiap `interval` detik selama `menit`.
 *   tabata   8 putaran 20 detik kerja / 10 detik istirahat.
 */
export interface SetelanJam {
  jenis: 'amrap' | 'fortime' | 'emom' | 'tabata'
  menit?: number
  batas?: number
  interval?: number
  /** Ronde yang direncanakan, untuk memperlihatkan sisa pada For Time. */
  ronde?: number
}

export interface Benchmark {
  nama: string
  kelompok: 'girls' | 'hero' | 'pemula'
  format: string
  isi: string[]
  bebanRx?: string
  targetWaktu: string
  bodyweight: boolean
  skala: string
  catatan?: string
  jam?: SetelanJam
  /** Ilustrasi gerakan khas sesi ini. */
  gambar?: string
}

export const BENCHMARK: Benchmark[] = [
  // ── Bodyweight, cocok dipelajari lebih dulu ───────────────────────────────
  {
    nama: 'Cindy', kelompok: 'girls', format: '20-minute AMRAP', bodyweight: true,
    isi: ['5 pull-up', '10 push-up', '15 air squat'],
    targetWaktu: 'Beginner 8–12 rounds · intermediate 15–20 · advanced 20+',
    skala: 'Swap pull-ups for ring rows or band-assisted pull-ups; push-ups from the knees or inclined on a box. If the first round takes more than 90 seconds, drop the reps to 3-6-9.',
    catatan: 'The best-known bodyweight benchmark and the best entry point: no barbell, no Olympic technique.',
    jam: { jenis: 'amrap', menit: 20 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083337_5782b2e5-977a-431f-83ab-58a204abf01a.png',
  },
  {
    nama: 'Mary', kelompok: 'girls', format: '20-minute AMRAP', bodyweight: true,
    isi: ['5 handstand push-up', '10 pistols (single-leg squats)', '15 pull-up'],
    targetWaktu: 'Beginners rarely go Rx — 5–8 rounds is good',
    skala: 'Swap handstand push-ups for pike push-ups on a box; pistols for single-leg squats to a bench with support.',
    catatan: 'It looks like Cindy but is far more technical. It needs shoulder and ankle mobility that is already in place.',
    jam: { jenis: 'amrap', menit: 20 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083418_a3fd503d-5b64-4222-a054-2fa16fdcbd38.png',
  },
  {
    nama: 'Angie', kelompok: 'girls', format: 'For Time', bodyweight: true,
    isi: ['100 pull-up', '100 push-up', '100 sit-up', '100 air squat'],
    targetWaktu: 'Beginner 25–35 min · intermediate 18–22 · advanced <15',
    skala: 'The "Half Angie" version (50 of each) is an honest entry point. Each movement is completed in full before moving on.',
    catatan: '400 reps in total. This is one of the sessions that carries a rhabdomyolysis risk in the unaccustomed — see the warning below.',
    jam: { jenis: 'fortime', batas: 40, ronde: 4 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083418_58a5a9ff-dfa4-4847-9668-76fa995f8321.png',
  },
  {
    nama: 'Barbara', kelompok: 'girls', format: '5 rounds, 3 minutes rest', bodyweight: true,
    isi: ['20 pull-up', '30 push-up', '40 sit-up', '50 air squat', 'a full 3 minutes rest'],
    targetWaktu: '5–7 minutes per round; 35–50 minutes in total',
    skala: 'Cut to 3 rounds or halve the reps. The 3 minutes rest MUST be taken in full — it is part of the design.',
    catatan: 'Scheduled rest means every round can be run fast. Comparing round times shows your endurance very honestly.',
    jam: { jenis: 'fortime', batas: 60, ronde: 5 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083446_c6383c15-f36d-4cbb-a3fb-a072d749800e.png',
  },
  {
    nama: 'Chelsea', kelompok: 'girls', format: '30-minute EMOM', bodyweight: true,
    isi: ['Every minute: 5 pull-ups, 10 push-ups, 15 air squats'],
    targetWaktu: 'How many minutes before you fall behind — 15 is good for a beginner',
    skala: 'Make it an E2MOM (every two minutes) or cut to 3-6-9. Stop once you can no longer finish inside the minute.',
    catatan: 'Cindy as an EMOM. The volume is as large as Angie’s — give it the same respect.',
    jam: { jenis: 'emom', menit: 30, interval: 60 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083337_94c29308-4f11-44e4-8a1e-dab015ed73d0.png',
  },
  {
    nama: 'Annie', kelompok: 'girls', format: 'For Time (50-40-30-20-10)', bodyweight: true,
    isi: ['Double-under', 'Sit-up'],
    targetWaktu: 'Beginner 12–18 min · advanced <7',
    skala: 'Swap double-unders for single-unders at double the reps (100-80-60-40-20) — not half.',
    catatan: 'Good for learning double-unders: low fatigue, high repetition.',
    jam: { jenis: 'fortime', batas: 25, ronde: 5 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083446_5ebd67f0-eedb-4b9d-b9a7-398b5c7594b1.png',
  },
  // ── Melibatkan beban ──────────────────────────────────────────────────────
  {
    nama: 'Fran', kelompok: 'girls', format: 'For Time (21-15-9)', bodyweight: false,
    isi: ['Thruster', 'Pull-up'], bebanRx: '43 kg men / 30 kg women',
    targetWaktu: 'Beginner 8–12 min · intermediate 5–7 · elite <3',
    skala: 'Lower the load until the set of 21 can be done in two sets at most. If it needs breaking up more than that, the load is too heavy for what this session is for.',
    catatan: 'The best-known benchmark. Precisely because it is short, the temptation to go too heavy is strongest here.',
    jam: { jenis: 'fortime', batas: 20, ronde: 3 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083519_006b461e-5a1b-4564-8103-38fb0cb31604.png',
  },
  {
    nama: 'Helen', kelompok: 'girls', format: '3 rounds For Time', bodyweight: false,
    isi: ['400 m run', '21 kettlebell swings', '12 pull-up'], bebanRx: 'KB 24 kg / 16 kg',
    targetWaktu: 'Beginner 14–18 min · intermediate 10–12 · advanced <9',
    skala: 'Cut the run to 200–300 m; lower the kettlebell so 21 swings can be done unbroken.',
    catatan: 'A triplet with a good balance of running, pulling and hip hinging.',
    jam: { jenis: 'fortime', batas: 25, ronde: 3 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083519_18a709c3-7989-4fd6-9870-54152decf686.png',
  },
  {
    nama: 'Grace', kelompok: 'girls', format: 'For Time', bodyweight: false,
    isi: ['30 clean & jerk'], bebanRx: '61 kg / 43 kg',
    targetWaktu: 'Beginner 6–10 min · advanced <3',
    skala: 'Use a load you can lift 10 times unbroken when fresh — usually far lighter than you would guess.',
    catatan: 'A single Olympic movement repeated. Do NOT attempt this before a coach has assessed your clean & jerk.',
    jam: { jenis: 'fortime', batas: 20 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083613_3f88385a-0b96-4299-b775-60d1fcd642bc.png',
  },
  {
    nama: 'Karen', kelompok: 'girls', format: 'For Time', bodyweight: false,
    isi: ['150 wall ball'], bebanRx: '9 kg to a 3 m target / 6 kg to 2.7 m',
    targetWaktu: 'Beginner 12–18 min · advanced <7',
    skala: 'Drop to 100 or 75 reps before you drop the weight of the ball.',
    catatan: 'Simple and brutal. The quad soreness afterwards usually lasts several days.',
    jam: { jenis: 'fortime', batas: 25 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083613_a052adb9-4d8b-468d-adc4-656553548344.png',
  },
  // ── Hero WOD ──────────────────────────────────────────────────────────────
  {
    nama: 'Murph', kelompok: 'hero', format: 'For Time', bodyweight: false,
    isi: ['1.6 km run', '100 pull-up', '200 push-up', '300 air squat', '1.6 km run'],
    bebanRx: 'With a 9 kg / 6 kg vest',
    targetWaktu: 'Beginner 55–75 min · intermediate 40–50 · advanced <35',
    skala: 'No vest, break it into 20 rounds of 5-10-15, and halve it ("Half Murph") on a first attempt. This is the single session that causes the most rhabdomyolysis in a year.',
    catatan: 'Named for Lieutenant Michael Murphy, a Navy SEAL killed in Afghanistan in 2005. Usually done on Memorial Day.',
    jam: { jenis: 'fortime', batas: 90, ronde: 5 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083635_9f4e8d09-4549-47be-80c5-1470fccc884c.png',
  },
  {
    nama: 'Chad', kelompok: 'hero', format: 'For Time', bodyweight: true,
    isi: ['1000 box step-ups (50 cm box)'], bebanRx: '20 kg / 14 kg backpack',
    targetWaktu: '60–100 minutes',
    skala: 'No rucksack, a lower box, and 500 reps for a first attempt.',
    catatan: 'Named for Chad Wilkinson, a Navy SEAL who died by suicide in 2018; the session is used to raise awareness of suicide prevention among veterans.',
    jam: { jenis: 'fortime', batas: 120 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083635_ce1827e7-b0b7-42f7-bdd7-717c5aaa8ba8.png',
  },
  {
    nama: 'JT', kelompok: 'hero', format: 'For Time (21-15-9)', bodyweight: true,
    isi: ['Handstand push-up', 'Ring dip', 'Push-up'],
    targetWaktu: 'Beginner 15–25 min · advanced <8',
    skala: 'Pike push-ups, bench dips, knee push-ups. The descending ladder helps — the hardest part comes first.',
    catatan: 'Named for Petty Officer Jeff Taylor, killed in the same operation as Michael Murphy.',
    jam: { jenis: 'fortime', batas: 30, ronde: 3 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083727_de56f00d-d2cf-42ef-b31e-7fe3bf370a19.png',
  },
  // ── Titik masuk ───────────────────────────────────────────────────────────
  {
    nama: 'Baby Cindy', kelompok: 'pemula', format: '10-minute AMRAP', bodyweight: true,
    isi: ['3 ring rows', '6 push-ups (incline allowed)', '9 air squats'],
    targetWaktu: '6-10 rounds',
    skala: 'If 10 rounds feels easy, extend the time to 15 minutes before adding reps.',
    catatan: 'Start here if this is your first week. There is nothing embarrassing about starting here.',
    jam: { jenis: 'amrap', menit: 10 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083727_eedc9d38-876e-498e-8a66-8892d96d4d2e.png',
  },
  {
    nama: 'Intro EMOM', kelompok: 'pemula', format: '10-minute EMOM', bodyweight: true,
    isi: ['Odd minutes: 8 air squats + 4 push-ups', 'Even minutes: full rest'],
    targetWaktu: 'Finish without gasping',
    skala: 'Only add reps if you still have 30 seconds of rest in each working minute.',
    catatan: 'The safest format for learning the movements while it still feels like training.',
    jam: { jenis: 'emom', menit: 10, interval: 60 },
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083753_14cd072d-cecf-4c64-a315-adaf8fcc1425.png',
  },
]

// Arketipe motivasi. Sengaja BUKAN tokoh berhak cipta: menamai program latihan
// dengan Batman atau Spider-Man beserta gambarnya adalah pemakaian merek dan
// karakter milik orang lain, dan itu risiko hukum yang ditanggung pemilik
// aplikasi — bukan sesuatu yang pantas saya tinggalkan diam-diam di kode.
// Arketipenya sendiri (kelelawar, laba-laba, mesin, raksasa) memang lebih tua
// dari tokoh mana pun dan bebas dipakai.
export interface Arketipe {
  id: string
  /** Lencana arketipe; ikon emoji dipakai bila belum ada. */
  gambar?: string
  ikon: string
  nama: string
  sifat: string
  latihan: string
  format: string
  kenapa: string
}

export const ARKETIPE: Arketipe[] = [
  { id: 'kelelawar', gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_084005_89809645-98f7-4e0d-a0e0-693070145f92.png', ikon: '🦇', nama: 'The Night Watch', sifat: 'An ordinary person who wins through discipline rather than talent',
    latihan: 'Base strength + work capacity', format: 'Barbara or Chelsea',
    kenapa: 'The archetype with no superpowers. All of it comes from training repeated when nobody is watching — and Barbara’s scheduled rest tests exactly that.' },
  { id: 'laba-laba', gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_084005_1b9bba55-233f-4a1d-af05-47702fefdd46.png', ikon: '🕷️', nama: 'The Climber', sifat: 'Light, agile, strong relative to body weight',
    latihan: 'Strength-to-weight ratio', format: 'Cindy, then Mary',
    kenapa: 'Every movement is bodyweight. Progress comes from getting stronger at your own body, not from adding load.' },
  { id: 'baja', gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_084027_21649ae4-79ce-4e0e-a789-7bb8e5553e63.png', ikon: '🛡️', nama: 'The Shield', sifat: 'Endurance that does not run out',
    latihan: 'Long-duration endurance', format: 'Murph (scaled) or HYROX',
    kenapa: 'Long sessions test something different from hard ones: staying technically clean past the 40-minute mark.' },
  { id: 'mesin', gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_084027_a2c19749-889e-43f1-9508-941866f19330.png', ikon: '⚙️', nama: 'The Engineer', sifat: 'Winning through calculation and tools rather than muscle',
    latihan: 'Pacing and strategy', format: 'Any AMRAP with a rep-breakdown plan',
    kenapa: 'Write your rep-breakdown plan BEFORE the clock starts, then follow it. This is the skill that raises scores fastest.' },
  { id: 'raksasa', gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_084202_b39923ca-18a1-48f1-a12f-4e162cfa4905.png', ikon: '💪', nama: 'The Giant', sifat: 'Raw strength, short bursts',
    latihan: 'Maximal strength', format: 'Grace or Karen',
    kenapa: 'Short and heavy. This archetype most needs restraint: raw strength without technique is the fastest route to a back injury.' },
  { id: 'petir', gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_084202_737ab391-d512-4aa6-83d8-45187a8ff5de.png', ikon: '⚡', nama: 'The Sprinter', sifat: 'Speed above everything',
    latihan: 'Anaerobic power', format: 'Fran or Tabata',
    kenapa: 'All of them finish in under ten minutes. Enjoyable — and for exactly that reason, the ones most often done too often.' },
]

export interface Peringatan {
  judul: string
  isi: string
  tanda: string[]
}

export const RABDO: Peringatan = {
  judul: 'Rhabdomyolysis — know this before you start',
  isi: 'Very high-volume training, especially repeated lowering movements (pull-up descents, lunges, box step-downs) in someone untrained, can damage muscle fibres badly enough that myoglobin enters the blood and stresses the kidneys. This is not scaremongering: the cases most often reported follow Murph, Angie, and somebody’s first session back after a long break. It is a medical emergency.',
  tanda: [
    'Muscle pain far beyond ordinary training soreness, especially 24–72 hours afterwards',
    'Visible swelling of the muscles you trained',
    'Urine the colour of dark brown or tea',
    'Muscle weakness that does not improve, or an arm you cannot straighten',
    'Nausea, fever, or passing much less urine than usual',
  ],
}

/** Ilustrasi untuk kartu aturan aman: push-up dari lutut, versi yang diskalakan. */
export const GAMBAR_SKALA = 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_083753_1db052b0-69e3-4d43-9fc4-4f8a8a4325ef.png'

export const ATURAN_AMAN = [
  'Scale until the session finishes inside the suggested time range. A session that runs twice as long is not a harder version — it is the wrong dose.',
  'First week: do half of whatever volume is written, without exception. That includes when you feel fit from another sport.',
  'Stop when technique breaks, not when the reps run out. A rep with a rounded back does not "still count" as far as your body is concerned.',
  'Do not run two high-volume sessions back to back. Angie, Chelsea, Barbara and Murph each need 48–72 hours of recovery.',
  'If you are just over an illness, badly short of sleep, or dehydrated — postpone. Each of those is an independent risk factor for rhabdomyolysis.',
  'Learn the Olympic lifts (clean, jerk, snatch) with a coach first. No video can see your back.',
]

export const RUJUKAN = [
  'Tabata I, et al. Effects of moderate-intensity endurance and high-intensity intermittent training on anaerobic capacity and VO2max. Med Sci Sports Exerc. 1996;28(10):1327-30.',
  'Hopkins BS, et al. Rhabdomyolysis in CrossFit: a systematic review. Orthop J Sports Med. 2019.',
  'ACSM. Guidelines for Exercise Testing and Prescription, 11th edition, 2021 — chapters on scaling and training-load progression.',
  'Meyer M, et al. Exertional rhabdomyolysis: a systematic review. Sports Health. 2018;10(3):260-266.',
]
