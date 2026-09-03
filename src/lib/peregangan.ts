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
    id: 'ayun-kaki', nama: 'Leg swings', kapan: 'sebelum', target: 'Hips, hamstrings, hip flexors',
    durasi: '10–15 swings per leg, per direction',
    cara: [
      'Hold a wall or post with one hand.',
      'Swing one straight leg forward and back, controlled — not thrown.',
      'Keep the torso upright and still; only the leg moves, from the hip.',
      'Repeat sideways (left-right swings across the body) for the adductors.',
    ],
    untuk: ['Running', 'Cycling', 'Football', 'General'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_f1f25333-8ce5-4225-88c2-f44fc4068096.mp4',
    hindari: 'Do not swing as hard as you can on the first rep. Build the range gradually.',
  },
  {
    id: 'lunge-rotasi', nama: "World's greatest stretch", kapan: 'sebelum', target: 'Hip flexors, thoracic spine, hamstrings',
    durasi: '5 reps per side',
    cara: [
      'Step into a long forward lunge with the back leg straight.',
      'Place the inside hand on the floor, level with the front foot.',
      'Rotate the torso and reach the outside arm straight to the ceiling, eyes following the hand.',
      'Hold briefly at the top, then lower and switch sides.',
    ],
    untuk: ['Running', 'Lifting', 'CrossFit', 'General'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_b9b74010-a0d6-42d0-b66f-e48c2990ab73.mp4',
    hindari: 'If the back knee hurts, put it on a pad — not a reason to stop.',
  },
  {
    id: 'squat-dalam', nama: 'Deep squat hold', kapan: 'sebelum', target: 'Ankles, hips, lower back',
    durasi: '5 reps, holding 5 seconds',
    cara: [
      'Sink into the deepest squat you can with heels staying on the floor.',
      'Elbows inside the knees, press the knees outward slowly.',
      'Keep the chest lifted throughout.',
      'Stand up and repeat. Depth usually improves with each round.',
    ],
    untuk: ['Lifting', 'CrossFit', 'General'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085407_31fa57a2-2b37-41e3-a3af-342e5504f179.png',
  },
  {
    id: 'lengan-renang', nama: 'Arm circles & shoulder pulls', kapan: 'sebelum', target: 'Shoulders, chest, upper back',
    durasi: '10 circles each direction',
    cara: [
      'Circle both arms in large arcs forward, then backward.',
      'Follow with elbows pulled back, shoulder blades squeezed together.',
      'Finish by miming a slow swimming pull in the air.',
    ],
    untuk: ['Swimming', 'Lifting', 'General'],
    hindari: 'If the shoulder has dislocated before, or lifting the arm hurts, get it checked first.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085406_34944294-f6ec-4adb-ac1e-4983a9e43e27.png',
  },
  // ── Sesudah latihan: statis ───────────────────────────────────────────────
  {
    id: 'fleksor-pinggul', nama: 'Kneeling hip flexor stretch', kapan: 'sesudah', target: 'Psoas, rectus femoris',
    durasi: 'Hold 30–45 seconds per side',
    cara: [
      'Kneel on one knee with the other foot flat in front.',
      'Tuck the pelvis under (as if drawing the tailbone forward) — this is the part that matters.',
      'Stay upright; do not lean forward.',
      'Raise the arm on the side of the lower knee to deepen it.',
    ],
    untuk: ['Running', 'Cycling', 'Desk work'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_f35cc36c-7c28-404f-8501-6bc49021ee28.mp4',
    hindari: 'Do not push the pelvis forward without tucking it — that only arches the lower back.',
  },
  {
    id: 'hamstring-duduk', nama: 'Hamstring stretch', kapan: 'sesudah', target: 'Hamstrings, calves',
    durasi: 'Hold 30 seconds per side',
    cara: [
      'Sit with one leg straight, the other bent inward.',
      'Hinge from the HIP, not the back — chest toward the knee.',
      'Keep the back flat; if it rounds you are stretching your lower back, not your hamstring.',
      'Breathe out as you deepen.',
    ],
    untuk: ['Running', 'Cycling', 'General'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085432_e780e996-aace-4073-a072-947753781a8b.png',
  },
  {
    id: 'betis-dinding', nama: 'Wall calf stretch', kapan: 'sesudah', target: 'Gastrocnemius, soleus',
    durasi: '30 seconds knee straight + 30 seconds knee bent, per side',
    cara: [
      'Both hands on the wall, one foot back, heel down.',
      'A STRAIGHT back knee stretches the gastrocnemius.',
      'Then bend the back knee slightly, heel still down — this reaches the soleus.',
      'You need both; most people only ever do the first.',
    ],
    untuk: ['Running', 'General'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085432_ead9605a-09f0-473b-9815-53fb9c568f27.png',
  },
  {
    id: 'piriformis', nama: 'Glute & piriformis stretch', kapan: 'sesudah', target: 'Glutes, piriformis',
    durasi: 'Hold 30 seconds per side',
    cara: [
      'Lie on your back and cross one ankle over the opposite knee (a figure 4).',
      'Draw the lower thigh toward your chest.',
      'Head and shoulders stay relaxed on the floor.',
    ],
    untuk: ['Running', 'Cycling', 'Desk work'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085503_590bd489-2d5e-41a7-85e9-25eb752f4658.png',
  },
  {
    id: 'dada-pintu', nama: 'Doorway chest stretch', kapan: 'sesudah', target: 'Pectorals, front of shoulder',
    durasi: 'Hold 30 seconds, 2–3 times',
    cara: [
      'Forearm against the door frame, elbow at shoulder height.',
      'Step forward slowly until you feel the stretch across the chest.',
      'Repeat with the elbow higher and lower to reach different fibres.',
    ],
    untuk: ['Swimming', 'Lifting', 'Desk work'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085503_8edb16dc-a6bd-497a-848d-721a539ed363.png',
  },
  // ── Harian / postur ───────────────────────────────────────────────────────
  {
    id: 'rotasi-toraks', nama: 'Thoracic spine rotation', kapan: 'harian', target: 'Thoracic spine',
    durasi: '8–10 reps per side',
    cara: [
      'On all fours with one hand behind the head.',
      'Rotate the elbow down toward the opposite wrist.',
      'Then open it up toward the ceiling, following with your eyes.',
      'Keep the pelvis facing the floor — if it rotates too, the movement misses its target.',
    ],
    untuk: ['Desk work', 'Swimming', 'Lifting', 'General'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054839_9a901a97-ac23-4891-93de-5c0185f558b5.mp4',
  },
  {
    id: 'leher-dagu', nama: 'Chin tucks & neck stretch', kapan: 'harian', target: 'Deep neck, upper trapezius',
    durasi: '10 tucks + hold 30 seconds per side',
    cara: [
      'Draw the chin straight back (making a double chin), hold 3 seconds, release.',
      'Then tilt the head to one side, that hand pulling gently.',
      'Press the opposite shoulder down.',
    ],
    untuk: ['Desk work', 'General'],
    hindari: 'Do not roll the neck in full circles — that compresses the facet joints with no added benefit.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085538_f55f314e-6a3e-4b9c-9ed7-11b44fe85481.png',
  },
  {
    id: 'kucing-sapi', nama: 'Cat-cow', kapan: 'harian', target: 'The whole spine',
    durasi: '10 cycles, following the breath',
    cara: [
      'On all fours.',
      'Inhale: drop the belly, lift the chest and tailbone.',
      'Exhale: round the back and draw the chin to the chest.',
      'Move slowly and follow the breath, rather than chasing repetitions.',
    ],
    untuk: ['Desk work', 'General'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085538_b100a43e-221f-4597-a8dc-e2cc527dbc13.png',
  },
  // ── Yoga & pilates ────────────────────────────────────────────────────────
  {
    id: 'anjing-menunduk', nama: 'Downward dog', kapan: 'yoga', target: 'The whole posterior chain',
    durasi: 'Hold 30–60 seconds',
    cara: [
      'From all fours, push the hips up and back into a triangle.',
      'Bending the knees is fine — a straight back matters more than straight legs.',
      'Push the floor away through your palms; ears in line with the arms.',
    ],
    untuk: ['Yoga', 'Running', 'General'],
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085706_011d1bd8-8060-455b-b5cb-2733a711366c.png',
  },
  {
    id: 'merpati', nama: 'Pigeon pose', kapan: 'yoga', target: 'External hip rotators',
    durasi: 'Hold 60–90 seconds per side',
    cara: [
      'From a plank, bring one knee forward behind the wrist on the same side.',
      'Back leg extended straight behind you.',
      'Lower the torso forward as far as is comfortable.',
    ],
    untuk: ['Yoga', 'Running', 'Cycling'],
    hindari: 'If the front knee hurts (rather than the hip), come out of it. This is the position that most often loads the knee wrongly.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_085706_5508cca5-bb3a-4948-b2b4-39be75a05e5d.png',
  },
  {
    id: 'gulung-pilates', nama: 'Pilates roll down', kapan: 'yoga', target: 'Spinal control, hamstrings',
    durasi: '5–8 reps',
    cara: [
      'Stand tall, feet hip-width apart.',
      'Drop the chin, then roll the spine down one vertebra at a time.',
      'Hang at the bottom for a moment, then roll back up the same way.',
      'Keep the abdomen engaged throughout.',
    ],
    untuk: ['Pilates', 'Desk work', 'General'],
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
    id: 'pra-lari', nama: 'Before a run', ikon: '🏃', ringkas: 'Dynamic, 5–6 minutes',
    urutan: ['ayun-kaki', 'lunge-rotasi', 'squat-dalam'],
    durasiTotal: '5–6 minutes',
    catatan: 'Then start running with 5–10 very easy minutes as a continued warm-up. Do not do static stretching here.',
  },
  {
    id: 'pasca-lari', nama: 'After a run', ikon: '🧘', ringkas: 'Static, 6–8 minutes',
    urutan: ['fleksor-pinggul', 'hamstring-duduk', 'betis-dinding', 'piriformis'],
    durasiTotal: '6–8 minutes',
    catatan: 'The best time for static stretching: the muscle is warm, and there is no power left to protect.',
  },
  {
    id: 'pra-angkat', nama: 'Before lifting', ikon: '🏋️', ringkas: 'Dynamic, 6–8 minutes',
    urutan: ['squat-dalam', 'lunge-rotasi', 'lengan-renang', 'rotasi-toraks'],
    durasiTotal: '6–8 minutes',
    catatan: 'Follow with warm-up sets using light loads on the movement you are about to train.',
  },
  {
    id: 'renang', nama: 'Before swimming', ikon: '🏊', ringkas: 'Shoulders & upper back, 5 minutes',
    urutan: ['lengan-renang', 'rotasi-toraks', 'dada-pintu'],
    durasiTotal: '5 minutes',
    catatan: 'Swimming demands shoulder rotation thousands of times over. A stiff upper back forces the shoulder to cover the shortfall.',
  },
  {
    id: 'sepeda', nama: 'After cycling', ikon: '🚴', ringkas: 'Hip focus, 6 minutes',
    urutan: ['fleksor-pinggul', 'piriformis', 'hamstring-duduk', 'rotasi-toraks'],
    durasiTotal: '6 minutes',
    catatan: 'Cycling locks the hip in flexion for hours. Hip flexors are the first priority.',
  },
  {
    id: 'meja', nama: 'Desk break', ikon: '💺', ringkas: 'Posture, 4 minutes',
    urutan: ['leher-dagu', 'rotasi-toraks', 'dada-pintu', 'fleksor-pinggul'],
    durasiTotal: '4 minutes',
    catatan: 'Do it every 2–3 hours. Short frequent sessions are far more useful than one long session at the end of the day.',
  },
  {
    id: 'pagi', nama: 'On waking', ikon: '🌅', ringkas: 'Gentle, 5 minutes',
    urutan: ['kucing-sapi', 'rotasi-toraks', 'gulung-pilates', 'anjing-menunduk'],
    durasiTotal: '5 minutes',
    catatan: 'Spinal discs absorb the most fluid during sleep, so avoid loaded full flexion in the first hour after waking.',
  },
]

export const SALAH_KAPRAH = [
  {
    klaim: 'Static stretching before exercise prevents injury.',
    fakta: 'Systematic reviews find no reduction in injury risk, and holding a stretch beyond 60 seconds before activity temporarily lowers power and strength. What does reduce injury risk is a graded warm-up and regular strength training.',
  },
  {
    klaim: 'Stretching removes muscle soreness after training (DOMS).',
    fakta: 'The effect is tiny to meaningless — around one point on a 100-point scale. Stretching remains useful for range of motion and comfort, just not for this.',
  },
  {
    klaim: 'Pain means it is working.',
    fakta: 'A stretch should feel like a pull, not sharp or stabbing. Sharp pain, tingling, or numbness means stop — those are nerve signs, not muscle.',
  },
  {
    klaim: 'If you are not flexible, you have not stretched enough.',
    fakta: 'Range of motion is also limited by joint structure and nervous-system tolerance. Some limits cannot be stretched away, and forcing them loads the joint instead.',
  },
]

export const RUJUKAN_PEREGANGAN = [
  'Behm DG, dkk. Acute effects of muscle stretching on physical performance, range of motion, and injury incidence in healthy active individuals. Appl Physiol Nutr Metab. 2016;41(1):1-11.',
  'Herbert RD, de Noronha M, Kamper SJ. Stretching to prevent or reduce muscle soreness after exercise. Cochrane Database Syst Rev. 2011;(7):CD004577.',
  'ACSM. Guidelines for Exercise Testing and Prescription, 11th edition, 2021 — flexibility and range-of-motion chapters.',
  'Lauersen JB, dkk. The effectiveness of exercise interventions to prevent sports injuries. Br J Sports Med. 2014;48(11):871-877.',
]
