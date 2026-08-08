// ─────────────────────────────────────────────────────────────────────────────
// Peregangan — protokol per situasi, bukan satu daftar untuk semua.
//
// Satu hal yang perlu diluruskan lebih dulu, karena hampir semua orang salah:
// peregangan STATIS sebelum latihan (menahan posisi 30 detik atau lebih)
// menurunkan tenaga dan kekuatan sementara, dan tidak menurunkan risiko cedera.
// Yang sebelum latihan seharusnya DINAMIS — gerakan yang membawa sendi melewati
// rentang geraknya berulang kali. Peregangan statis punya tempatnya sendiri:
// setelah latihan, atau sebagai sesi terpisah untuk menambah rentang gerak.
//
// Karena itu daftar di bawah dipisah menurut KAPAN, bukan menurut otot. Orang
// tidak salah memilih otot; mereka salah memilih waktu.
// ─────────────────────────────────────────────────────────────────────────────

export type Kapan = 'sebelum' | 'sesudah' | 'harian' | 'yoga'

export interface Gerakan {
  id: string
  nama: string
  kapan: Kapan
  target: string
  durasi: string
  cara: string[]
  untuk: string[]      // cabang olahraga / situasi
  hindari?: string
  video?: string       // URL klip demonstrasi, bila ada
  gambar?: string      // Foto acuan posisi, untuk gerakan yang belum berklip
}

export const GERAKAN: Gerakan[] = [
  // ── Sebelum latihan: dinamis ──────────────────────────────────────────────
  {
    id: 'ayun-kaki', nama: 'Ayunan kaki', kapan: 'sebelum', target: 'Pinggul, hamstring, fleksor pinggul',
    durasi: '10-15 ayunan per kaki, per arah',
    cara: [
      'Hold a wall or post with one hand.',
      'Swing one straight leg forward and back, controlled — not thrown.',
      'Keep the torso upright and still; only the leg moves, from the hip.',
      'Repeat sideways (left-right swings across the body) for the adductors.',
    ],
    untuk: ['Lari', 'Sepeda', 'Sepak bola', 'Umum'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_f1f25333-8ce5-4225-88c2-f44fc4068096.mp4',
    hindari: 'Do not swing as hard as you can on the first rep. Build the range gradually.',
  },
  {
    id: 'lunge-rotasi', nama: "World's greatest stretch", kapan: 'sebelum', target: 'Fleksor pinggul, tulang punggung dada, hamstring',
    durasi: '5 kali per sisi',
    cara: [
      'Melangkah lunge panjang ke depan, kaki belakang lurus.',
      'Place the inside hand on the floor, level with the front foot.',
      'Rotate the torso and reach the outside arm straight to the ceiling, eyes following the hand.',
      'Hold briefly at the top, then lower and switch sides.',
    ],
    untuk: ['Lari', 'Angkat beban', 'CrossFit', 'Umum'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_b9b74010-a0d6-42d0-b66f-e48c2990ab73.mp4',
    hindari: 'If the back knee hurts, put it on a pad — not a reason to stop.',
  },
  {
    id: 'squat-dalam', nama: 'Deep squat hold', kapan: 'sebelum', target: 'Pergelangan kaki, pinggul, punggung bawah',
    durasi: '5 kali, tahan 5 detik',
    cara: [
      'Sink into the deepest squat you can with heels staying on the floor.',
      'Elbows inside the knees, press the knees outward slowly.',
      'Dada dijaga tetap terangkat.',
      'Berdiri, ulangi. Kedalaman biasanya bertambah tiap pengulangan.',
    ],
    untuk: ['Angkat beban', 'CrossFit', 'Umum'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085407_31fa57a2-2b37-41e3-a3af-342e5504f179.png',
  },
  {
    id: 'lengan-renang', nama: 'Putaran lengan & tarikan bahu', kapan: 'sebelum', target: 'Bahu, dada, punggung atas',
    durasi: '10 putaran tiap arah',
    cara: [
      'Circle both arms in large arcs forward, then backward.',
      'Follow with elbows pulled back, shoulder blades squeezed together.',
      'Finish by miming a slow swimming pull in the air.',
    ],
    untuk: ['Renang', 'Angkat beban', 'Umum'],
    hindari: 'If the shoulder has dislocated before, or lifting the arm hurts, get it checked first.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085406_34944294-f6ec-4adb-ac1e-4983a9e43e27.png',
  },
  // ── Sesudah latihan: statis ───────────────────────────────────────────────
  {
    id: 'fleksor-pinggul', nama: 'Peregangan fleksor pinggul berlutut', kapan: 'sesudah', target: 'Psoas, rektus femoris',
    durasi: 'Tahan 30-45 detik per sisi',
    cara: [
      'Berlutut satu kaki, kaki depan menapak di depan.',
      'Selipkan panggul ke bawah (seperti menarik tulang ekor ke depan) — inilah kuncinya.',
      'Badan tetap tegak, jangan condong ke depan.',
      'Raise the arm on the side of the lower knee to deepen it.',
    ],
    untuk: ['Lari', 'Sepeda', 'Kerja duduk lama'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_f35cc36c-7c28-404f-8501-6bc49021ee28.mp4',
    hindari: 'Do not push the pelvis forward without tucking it — that only arches the lower back.',
  },
  {
    id: 'hamstring-duduk', nama: 'Peregangan hamstring', kapan: 'sesudah', target: 'Hamstring, betis',
    durasi: 'Tahan 30 detik per sisi',
    cara: [
      'Sit with one leg straight, the other bent inward.',
      'Hinge from the HIP, not the back — chest toward the knee.',
      'Keep the back flat; if it rounds you are stretching your lower back, not your hamstring.',
      'Breathe out as you deepen.',
    ],
    untuk: ['Lari', 'Sepeda', 'Umum'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085432_e780e996-aace-4073-a072-947753781a8b.png',
  },
  {
    id: 'betis-dinding', nama: 'Peregangan betis di dinding', kapan: 'sesudah', target: 'Gastrocnemius, soleus',
    durasi: '30 detik lutut lurus + 30 detik lutut tertekuk, per sisi',
    cara: [
      'Kedua tangan di dinding, satu kaki mundur, tumit menempel lantai.',
      'Lutut belakang LURUS meregangkan gastrocnemius.',
      'Then bend the back knee slightly, heel still down — this reaches the soleus.',
      'You need both; most people only ever do the first.',
    ],
    untuk: ['Lari', 'Umum'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085432_ead9605a-09f0-473b-9815-53fb9c568f27.png',
  },
  {
    id: 'piriformis', nama: 'Peregangan gluteus & piriformis', kapan: 'sesudah', target: 'Gluteus, piriformis',
    durasi: 'Tahan 30 detik per sisi',
    cara: [
      'Lie on your back and cross one ankle over the opposite knee (a figure 4).',
      'Tarik paha kaki bawah ke arah dada.',
      'Head and shoulders stay relaxed on the floor.',
    ],
    untuk: ['Lari', 'Sepeda', 'Kerja duduk lama'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085503_590bd489-2d5e-41a7-85e9-25eb752f4658.png',
  },
  {
    id: 'dada-pintu', nama: 'Peregangan dada di kusen pintu', kapan: 'sesudah', target: 'Pektoralis, bahu depan',
    durasi: 'Tahan 30 detik, 2-3 kali',
    cara: [
      'Lengan bawah menempel kusen pintu, siku setinggi bahu.',
      'Melangkah maju perlahan sampai terasa tarikan di dada.',
      'Repeat with the elbow higher and lower to reach different fibres.',
    ],
    untuk: ['Renang', 'Angkat beban', 'Kerja duduk lama'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085503_8edb16dc-a6bd-497a-848d-721a539ed363.png',
  },
  // ── Harian / postur ───────────────────────────────────────────────────────
  {
    id: 'rotasi-toraks', nama: 'Rotasi tulang punggung dada', kapan: 'harian', target: 'Tulang punggung dada',
    durasi: '8-10 kali per sisi',
    cara: [
      'Posisi merangkak, satu tangan di belakang kepala.',
      'Rotate the elbow down toward the opposite wrist.',
      'Then open it up toward the ceiling, following with your eyes.',
      'Keep the pelvis facing the floor — if it rotates too, the movement misses its target.',
    ],
    untuk: ['Kerja duduk lama', 'Renang', 'Angkat beban', 'Umum'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054839_9a901a97-ac23-4891-93de-5c0185f558b5.mp4',
  },
  {
    id: 'leher-dagu', nama: 'Tarikan dagu & peregangan leher', kapan: 'harian', target: 'Deep neck, upper trapezius',
    durasi: '10 tarikan + tahan 30 detik per sisi',
    cara: [
      'Tarik dagu lurus ke belakang (membuat "dagu ganda"), tahan 3 detik, lepas.',
      'Then tilt the head to one side, that hand pulling gently.',
      'Bahu sisi berlawanan ditekan ke bawah.',
    ],
    untuk: ['Kerja duduk lama', 'Umum'],
    hindari: 'Do not roll the neck in full circles — that compresses the facet joints with no added benefit.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085538_f55f314e-6a3e-4b9c-9ed7-11b44fe85481.png',
  },
  {
    id: 'kucing-sapi', nama: 'Kucing-sapi', kapan: 'harian', target: 'Seluruh tulang belakang',
    durasi: '10 siklus, mengikuti napas',
    cara: [
      'Posisi merangkak.',
      'Inhale: drop the belly, lift the chest and tailbone.',
      'Buang napas: bulatkan punggung, tarik dagu ke dada.',
      'Move slowly and follow the breath, rather than chasing repetitions.',
    ],
    untuk: ['Kerja duduk lama', 'Umum'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085538_b100a43e-221f-4597-a8dc-e2cc527dbc13.png',
  },
  // ── Yoga & pilates ────────────────────────────────────────────────────────
  {
    id: 'anjing-menunduk', nama: 'Downward dog', kapan: 'yoga', target: 'Rantai posterior menyeluruh',
    durasi: 'Tahan 30-60 detik',
    cara: [
      'From all fours, push the hips up and back into a triangle.',
      'Bending the knees is fine — a straight back matters more than straight legs.',
      'Dorong lantai menjauh lewat telapak tangan; telinga sejajar lengan.',
    ],
    untuk: ['Yoga', 'Lari', 'Umum'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085706_011d1bd8-8060-455b-b5cb-2733a711366c.png',
  },
  {
    id: 'merpati', nama: 'Pigeon pose', kapan: 'yoga', target: 'Rotator pinggul luar',
    durasi: 'Tahan 60-90 detik per sisi',
    cara: [
      'From a plank, bring one knee forward behind the wrist on the same side.',
      'Kaki belakang lurus ke belakang.',
      'Lower the torso forward as far as is comfortable.',
    ],
    untuk: ['Yoga', 'Lari', 'Sepeda'],
    hindari: 'If the front knee hurts (rather than the hip), come out of it. This is the position that most often loads the knee wrongly.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085706_5508cca5-bb3a-4948-b2b4-39be75a05e5d.png',
  },
  {
    id: 'gulung-pilates', nama: 'Roll down pilates', kapan: 'yoga', target: 'Kontrol tulang belakang, hamstring',
    durasi: '5-8 kali',
    cara: [
      'Berdiri tegak, kaki selebar pinggul.',
      'Turunkan dagu, lalu gulung tulang belakang ke bawah satu ruas demi satu ruas.',
      'Hang at the bottom for a moment, then roll back up the same way.',
      'Perut tetap aktif sepanjang gerakan.',
    ],
    untuk: ['Pilates', 'Kerja duduk lama', 'Umum'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085731_adfb9240-f931-4763-99ed-6b8fb8164f92.png',
  },
]

export interface Protokol {
  id: string
  nama: string
  ikon: string
  ringkas: string
  urutan: string[]   // id gerakan
  durasiTotal: string
  catatan: string
}

export const PROTOKOL: Protokol[] = [
  {
    id: 'pra-lari', nama: 'Sebelum lari', ikon: '🏃', ringkas: 'Dinamis, 5-6 menit',
    urutan: ['ayun-kaki', 'lunge-rotasi', 'squat-dalam'],
    durasiTotal: '5-6 menit',
    catatan: 'Then start running with 5–10 very easy minutes as a continued warm-up. Do not do static stretching here.',
  },
  {
    id: 'pasca-lari', nama: 'Sesudah lari', ikon: '🧘', ringkas: 'Statis, 6-8 menit',
    urutan: ['fleksor-pinggul', 'hamstring-duduk', 'betis-dinding', 'piriformis'],
    durasiTotal: '6-8 menit',
    catatan: 'The best time for static stretching: the muscle is warm, and there is no power left to protect.',
  },
  {
    id: 'pra-angkat', nama: 'Sebelum angkat beban', ikon: '🏋️', ringkas: 'Dinamis, 6-8 menit',
    urutan: ['squat-dalam', 'lunge-rotasi', 'lengan-renang', 'rotasi-toraks'],
    durasiTotal: '6-8 menit',
    catatan: 'Follow with warm-up sets using light loads on the movement you are about to train.',
  },
  {
    id: 'renang', nama: 'Sebelum renang', ikon: '🏊', ringkas: 'Bahu & punggung atas, 5 menit',
    urutan: ['lengan-renang', 'rotasi-toraks', 'dada-pintu'],
    durasiTotal: '5 menit',
    catatan: 'Swimming demands shoulder rotation thousands of times over. A stiff upper back forces the shoulder to cover the shortfall.',
  },
  {
    id: 'sepeda', nama: 'Sesudah bersepeda', ikon: '🚴', ringkas: 'Fokus pinggul, 6 menit',
    urutan: ['fleksor-pinggul', 'piriformis', 'hamstring-duduk', 'rotasi-toraks'],
    durasiTotal: '6 menit',
    catatan: 'Cycling locks the hip in flexion for hours. Hip flexors are the first priority.',
  },
  {
    id: 'meja', nama: 'Jeda kerja duduk', ikon: '💺', ringkas: 'Postur, 4 menit',
    urutan: ['leher-dagu', 'rotasi-toraks', 'dada-pintu', 'fleksor-pinggul'],
    durasiTotal: '4 menit',
    catatan: 'Do it every 2–3 hours. Short frequent sessions are far more useful than one long session at the end of the day.',
  },
  {
    id: 'pagi', nama: 'Bangun tidur', ikon: '🌅', ringkas: 'Lembut, 5 menit',
    urutan: ['kucing-sapi', 'rotasi-toraks', 'gulung-pilates', 'anjing-menunduk'],
    durasiTotal: '5 menit',
    catatan: 'Spinal discs absorb the most fluid during sleep, so avoid loaded full flexion in the first hour after waking.',
  },
]

export const SALAH_KAPRAH = [
  {
    klaim: 'Peregangan statis sebelum olahraga mencegah cedera.',
    fakta: 'Systematic reviews find no reduction in injury risk, and holding a stretch beyond 60 seconds before activity temporarily lowers power and strength. What does reduce injury risk is a graded warm-up and regular strength training.',
  },
  {
    klaim: 'Stretching removes muscle soreness after training (DOMS).',
    fakta: 'The effect is tiny to meaningless — around one point on a 100-point scale. Stretching remains useful for range of motion and comfort, just not for this.',
  },
  {
    klaim: 'Sakit berarti berhasil.',
    fakta: 'A stretch should feel like a pull, not sharp or stabbing. Sharp pain, tingling, or numbness means stop — those are nerve signs, not muscle.',
  },
  {
    klaim: 'Kalau kurang lentur, berarti kurang meregang.',
    fakta: 'Range of motion is also limited by joint structure and nervous-system tolerance. Some limits cannot be stretched away, and forcing them loads the joint instead.',
  },
]

export const RUJUKAN_PEREGANGAN = [
  'Behm DG, dkk. Acute effects of muscle stretching on physical performance, range of motion, and injury incidence in healthy active individuals. Appl Physiol Nutr Metab. 2016;41(1):1-11.',
  'Herbert RD, de Noronha M, Kamper SJ. Stretching to prevent or reduce muscle soreness after exercise. Cochrane Database Syst Rev. 2011;(7):CD004577.',
  'ACSM. Guidelines for Exercise Testing and Prescription, 11th edition, 2021 — flexibility and range-of-motion chapters.',
  'Lauersen JB, dkk. The effectiveness of exercise interventions to prevent sports injuries. Br J Sports Med. 2014;48(11):871-877.',
]
