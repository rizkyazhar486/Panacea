// ─────────────────────────────────────────────────────────────────────────────
// Peregangan yang benar, per kelompok otot.
//
// Kenapa file ini ada: bagian "Koreksi Postur" di Foundation Training menyebut otot
// mana yang perlu diregangkan, tetapi tidak pernah mengajarkan CARANYA. Padahal
// peregangan adalah bagian yang paling sering dikerjakan dengan salah — bukan
// karena orang malas, melainkan karena empat hal berikut hampir tidak pernah
// disampaikan:
//
//   1. WAKTUNYA. Peregangan statis yang ditahan lama SEBELUM latihan menurunkan
//      kekuatan dan daya ledak untuk sementara. Pemanasan seharusnya dinamis;
//      peregangan statis tempatnya sesudah latihan atau sebagai sesi tersendiri.
//
//   2. DOSISNYA. Satu tarikan sepuluh detik tidak mengubah apa pun. Yang
//      menentukan pertambahan lingkup gerak adalah TOTAL WAKTU per otot per
//      minggu, dan ambangnya jauh lebih besar daripada yang diduga orang.
//
//   3. RASANYA. Peregangan yang benar terasa sebagai tarikan yang dapat
//      ditoleransi, bukan nyeri. Nyeri tajam adalah tanda berhenti, bukan tanda
//      berhasil — dan "no pain no gain" adalah nasihat yang keliru di sini.
//
//   4. OTOT YANG TERASA TEGANG BELUM TENTU OTOT YANG MEMENDEK. Otot yang lemah
//      dan tertarik memanjang juga menimbulkan rasa kencang. Meregangkannya
//      lebih jauh justru memperburuk keadaan. Ini penyebab tersering peregangan
//      yang dikerjakan rajin bertahun-tahun tanpa hasil.
//
// Seluruh isi di sini bersifat edukasi latihan untuk orang sehat, bukan terapi
// untuk cedera maupun nyeri yang sedang berlangsung.
// ─────────────────────────────────────────────────────────────────────────────

export type Wilayah = 'atas' | 'inti' | 'bawah'

export interface Stretch {
  nama: string
  /** Otot yang benar-benar disasar. */
  otot: string
  /** Langkah posisi, berurutan. */
  posisi: string[]
  /** Di mana tarikan seharusnya terasa — pembeda gerakan benar dan salah. */
  terasaDi: string
  /** Kesalahan tersering pada gerakan ini. */
  salah: string
  durasi: string
  /** Peringatan khusus bila ada. */
  hatiHati?: string
}

export interface MuscleGroup {
  key: string
  nama: string
  ikon: string
  wilayah: Wilayah
  /** Kenapa kelompok otot ini memendek pada orang kebanyakan. */
  kenapaTegang: string
  /** Akibatnya bila dibiarkan — menghubungkan ke postur maupun performa. */
  akibat: string
  stretches: Stretch[]
}

// ─── Kelompok otot ──────────────────────────────────────────────────────────

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    key: 'leher',
    nama: 'Neck & Upper Shoulders',
    ikon: '🦴',
    wilayah: 'atas',
    kenapaTegang:
      'An adult head weighs about 5 kg when balanced upright. For every 2.5 cm the head drifts forward, the effective load the muscles at the back of the neck must hold rises by roughly the weight of the head again. Hours spent looking down at a screen, a file, or an operating field leave the upper trapezius and levator scapulae holding that load without a break.',
    akibat:
      'A dull ache that never quite leaves the shoulders, headaches that start in the neck, and shoulders held up toward the ears all day without noticing.',
    stretches: [
      {
        nama: 'Upper trapezius stretch',
        otot: 'Upper trapezius',
        posisi: [
          'Sit tall and hold the underside of the chair with your right hand so the right shoulder cannot ride up',
          'Tilt the head left, bringing the left ear toward the left shoulder',
          'Add a very light pull with the left hand over the head — the weight of the hand alone is enough',
        ],
        terasaDi: 'Along the right side of the neck up over the shoulder',
        salah: 'Pulling hard on the head. This muscle is small and sits close to nerves; a forceful pull adds nothing and tends to trigger headaches.',
        durasi: '30 seconds each side, 2–3 times',
      },
      {
        nama: 'Levator scapulae stretch',
        otot: 'Levator scapulae',
        posisi: [
          'Sit tall with the right hand holding the chair',
          'Turn the head 45° to the left, as if looking toward your left trouser pocket',
          'Nod the head in that direction until you feel a pull in the back-right corner of the neck',
        ],
        terasaDi: 'The angle between the neck and the right shoulder, further back than the trapezius',
        salah: 'Nodding straight forward without turning first — that stretches a different muscle, not levator scapulae. The 45° rotation is the whole point.',
        durasi: '30 seconds each side, 2–3 times',
      },
      {
        nama: 'Chin tuck',
        otot: 'Suboccipitals (stretch) and deep neck flexors (strengthen)',
        posisi: [
          'Sit or stand tall, looking straight ahead',
          'Draw the chin straight back, making a double chin, without nodding down',
          'Hold 5 seconds, then release',
        ],
        terasaDi: 'A light pull behind the base of the skull, while the muscles at the front of the neck work',
        salah: 'Treating it as a nod. The chin travels BACKWARD horizontally, not down. This movement also strengthens a weak muscle, so it can be repeated many times a day.',
        durasi: '10 reps of 5 seconds, several times a day',
      },
    ],
  },
  {
    key: 'dada',
    nama: 'Chest & Front of Shoulder',
    ikon: '🫁',
    wilayah: 'atas',
    kenapaTegang:
      'Almost everything you do happens in front of your body: writing, typing, holding a phone, suturing, pushing. Pectoralis major and especially pectoralis minor sit shortened for hours, while nothing in an ordinary day lengthens them again.',
    akibat:
      'Shoulders pulled forward, the shoulder blade tilted so the space under the collarbone narrows, and over time raising the arm overhead becomes limited and painful.',
    stretches: [
      {
        nama: 'Doorway chest stretch',
        otot: 'Pectoralis major',
        posisi: [
          'Stand in a doorway, bend the elbow to 90° and place the forearm against the frame',
          'Set the elbow LEVEL WITH THE SHOULDER for the middle fibres',
          'Step one foot forward and shift your weight slowly until you feel the stretch',
        ],
        terasaDi: 'Across the front of the chest, not inside the shoulder joint',
        salah: 'Pushing until you feel it in the front of the shoulder joint. That is not a muscle stretch but a pull on the joint capsule, and repeated often it can leave the shoulder too loose at the front.',
        durasi: '30 seconds in each position, 2–3 times',
        hatiHati: 'Stop if you get pins and needles or numbness running into the arm — that means vessels and nerves are being compressed, not that the stretch is working.',
      },
      {
        nama: 'Pectoralis minor stretch (high elbow)',
        otot: 'Pectoralis minor',
        posisi: [
          'The same doorway position, but with the elbow raised above shoulder height',
          'Lean forward only slightly',
        ],
        terasaDi: 'Deeper and higher up, near the collarbone',
        salah: 'Skipping this variation. Pectoralis minor attaches to the shoulder blade, so it is the muscle that most directly pulls the shoulder forward — and it is not stretched with the elbow at shoulder height.',
        durasi: '30 seconds each side, 2–3 times',
      },
    ],
  },
  {
    key: 'punggung-atas',
    nama: 'Upper Back & Lats',
    ikon: '🔙',
    wilayah: 'atas',
    kenapaTegang:
      'The thoracic spine is built to rotate and extend, but slumped sitting locks it into a forward curve. The latissimus dorsi, which runs from the upper arm all the way to the pelvis, shortens with it and rotates the arm inward.',
    akibat:
      'A stiff upper back forces the neck and shoulder to move more to compensate. A great deal of shoulder pain actually comes from an upper back that cannot extend, not from the shoulder itself.',
    stretches: [
      {
        nama: 'Thoracic extension over a chair back',
        otot: 'Joints and muscles of the upper back',
        posisi: [
          'Sit with the chair back positioned just below your shoulder blades',
          'Support your head with both hands so the neck carries no load',
          'Arch the upper back backwards over the chair, without arching the lower back',
        ],
        terasaDi: 'An opening through the upper back and the front of the chest',
        salah: 'Arching from the lower back instead of the upper back. The lower back bends more easily, and it is precisely the part that does not need more arch.',
        durasi: '5–8 slow reps, or hold for 20–30 seconds',
      },
      {
        nama: 'Open book (rotasi berbaring miring)',
        otot: 'Upper-back rotation',
        posisi: [
          'Lie on your side with both knees bent to 90° and stacked, both arms straight out in front and stacked',
          'Open the top arm to the opposite side like opening a book, following it with your eyes',
          'Keep both knees together and in contact with the floor',
        ],
        terasaDi: 'Rotation through the upper back and a stretch across the chest',
        salah: 'Letting the knees open too. The moment they lift, the rotation moves into the lower back and the upper back gets nothing.',
        durasi: '8–10 slow reps each side',
      },
      {
        nama: 'Latissimus dorsi stretch',
        otot: 'Latissimus dorsi and teres major',
        posisi: [
          'Kneel in front of a chair or low table and place both elbows on it',
          'Sit your hips back toward your heels while letting the chest sink down',
          'Turn the palms upward to increase the stretch',
        ],
        terasaDi: 'Along the side of the body from the armpit to the waist',
        salah: 'Arching the lower back to reach further. Brace the abdomen lightly so the stretch stays in the lats.',
        durasi: '30 seconds, 2–3 times',
      },
    ],
  },
  {
    key: 'pinggul-depan',
    nama: 'Front of Hip (Hip Flexors)',
    ikon: '🦵',
    wilayah: 'inti',
    kenapaTegang:
      'Sitting holds the iliopsoas in a shortened position the entire time. For clinical students and desk workers that can mean eight to twelve hours a day. This muscle attaches directly to the lumbar vertebrae, so when it shortens it tilts the pelvis forward.',
    akibat:
      'The pelvis tips forward, the lower back over-arches and aches when standing for long, the glutes struggle to work fully, and running stride shortens because the leg cannot drive backwards.',
    stretches: [
      {
        nama: 'Kneeling hip flexor stretch',
        otot: 'Iliopsoas and rectus femoris',
        posisi: [
          'Kneel on one knee with the front foot flat and that knee at 90°',
          'SQUEEZE THE GLUTE on the kneeling side first — this is what tilts the pelvis backwards',
          'Push the hips forward only slightly, keeping the chest upright',
          'To add a stretch on rectus femoris, bend the back knee by holding that ankle',
        ],
        terasaDi: 'The front of the hip on the kneeling side',
        salah:
          'Lunging far forward while letting the lower back arch. If the lower back arches, the pelvis travels with it and the target muscle does not lengthen at all — only the lumbar joints are stretched. Squeezing the glute first is the step that separates a useful rep from a wasted one.',
        durasi: '30–45 seconds each side, 2–3 times',
      },
      {
        nama: 'Seated 90/90 stretch',
        otot: 'Deep hip rotators',
        posisi: [
          'Sit on the floor with the front leg bent to 90° in front of you and the back leg bent to 90° out to the side',
          'Keep the back tall and lean forward over the front leg',
        ],
        terasaDi: 'Dalam pinggul sisi tungkai depan',
        salah: 'Rounding the back to reach further. Depth means nothing if it comes from the spine.',
        durasi: '30 seconds each side',
      },
    ],
  },
  {
    key: 'bokong',
    nama: 'Glutes & Piriformis',
    ikon: '🍑',
    wilayah: 'inti',
    kenapaTegang:
      'Long sitting compresses the glutes directly while also leaving them rarely contracted. The piriformis, which sits beneath gluteus maximus, shortens — and in some people the sciatic nerve runs right past or straight through it.',
    akibat:
      'A dull ache in the buttock that worsens with long sitting, and in some people a referral down the back of the thigh that is often mistaken for a spinal problem.',
    stretches: [
      {
        nama: 'Lying figure-4',
        otot: 'Gluteus maximus and piriformis',
        posisi: [
          'Lie on your back and cross the right ankle over the left knee to form a figure four',
          'Hold behind the left thigh and draw it toward your chest',
          'Keep the head and shoulders on the floor',
        ],
        terasaDi: 'Deep in the right buttock',
        salah: 'Lifting the head and shoulders to reach the thigh. Loop a towel around the thigh instead if your hands do not reach.',
        durasi: '30–45 seconds each side, 2–3 times',
        hatiHati:
          'If what you feel is burning, tingling, or an electric sensation running down into the calf and foot, STOP. That is a nerve being pulled, not a muscle being stretched, and stretching further makes it worse.',
      },
      {
        nama: 'Pigeon pose (gentle version)',
        otot: 'Glutes and external hip rotators',
        posisi: [
          'From all fours, bring the right knee forward toward the right wrist',
          'Extend the left leg straight back',
          'Prop the right hip with a cushion or book if the pelvis tilts',
        ],
        terasaDi: 'Deep in the right buttock and the outer hip',
        salah: 'Forcing the pelvis flat to the floor without support, which moves the load into the front knee. If the knee hurts, stop and go back to the figure-4.',
        durasi: '45–60 seconds each side',
        hatiHati: 'Skip this one if you have a history of knee injury.',
      },
    ],
  },
  {
    key: 'pinggang',
    nama: 'Waist & Quadratus Lumborum',
    ikon: '🧍',
    wilayah: 'inti',
    kenapaTegang:
      'Standing on one leg, carrying a bag on one side, and sitting with a tilted pelvis all leave the quadratus lumborum on one side working continuously as a brace.',
    akibat:
      'A one-sided ache in the lower back that typically shows up late in the day, and hips that look uneven in height.',
    stretches: [
      {
        nama: 'Standing side bend',
        otot: 'Quadratus lumborum and the muscles of the side of the trunk',
        posisi: [
          'Stand with feet hip-width apart and raise the right arm straight overhead',
          'Lean to the left while pushing the right hip to the right',
          'Keep the body in one plane; do not lean forward',
        ],
        terasaDi: 'The right side of the waist up to below the armpit',
        salah: 'Bending forward while going sideways, which loses the stretch entirely.',
        durasi: '30 seconds each side',
      },
      {
        nama: 'Side-bent child pose',
        otot: 'Lower back and lats',
        posisi: [
          'Sit back on your heels and reach both hands forward on the floor',
          'Walk both hands to the right until you feel a stretch down the left side',
        ],
        terasaDi: 'The side of the lower back and waist',
        salah: 'Holding your breath. Long belly breaths help the back muscles let go.',
        durasi: '45 seconds each side',
      },
    ],
  },
  {
    key: 'hamstring',
    nama: 'Hamstrings (Back of Thigh)',
    ikon: '🦿',
    wilayah: 'bawah',
    kenapaTegang:
      'This is the most misunderstood muscle group of all. In people who sit for long hours the hamstrings do feel tight — but often not because they are short. A forward-tipped pelvis has been holding them lengthened all day, and a muscle held long and weak produces exactly the same feeling of tightness as a short one.',
    akibat:
      'Stretch the wrong thing and the tightness never leaves, no matter how many years you pull on it. What is needed is strengthening and a better pelvic position, not a harder stretch.',
    stretches: [
      {
        nama: 'Lying hamstring stretch with a towel',
        otot: 'Hamstrings',
        posisi: [
          'Lie on your back and loop a towel around the sole of the right foot',
          'Raise the right leg as far as is comfortable; a slight knee bend is fine',
          'Keep the left leg straight and on the floor — this stops the pelvis from rotating with it',
        ],
        terasaDi: 'The back of the thigh, through the belly of the muscle',
        salah:
          'Forcing the knee straight. The lying position is chosen precisely because the back is supported, so the stretch lands on the hamstring rather than on the lower back the way a standing toe-touch does.',
        durasi: '30–45 seconds each side, 2–3 times',
        hatiHati:
          'If it feels like a cord being pulled, a spreading heat, or tingling down to the calf, that is NERVE tension, not muscle. Lower the leg slightly and bend the knee until the feeling goes.',
      },
      {
        nama: 'Supported hip hinge',
        otot: 'Hamstrings, while also training the hip-hinge pattern',
        posisi: [
          'Stand and place the right heel on a low chair with the knee straight',
          'Set the back tall, then push the hips BACKWARD while hinging forward from the hip joint',
          'The back stays flat throughout',
        ],
        terasaDi: 'Belakang paha kanan',
        salah:
          'Rounding the back to reach the toes. That shifts the load onto the ligaments of the lower back and builds a movement habit that becomes dangerous under load.',
        durasi: '30 seconds each side',
      },
    ],
  },
  {
    key: 'kuadrisep',
    nama: 'Quadriceps (Front of Thigh)',
    ikon: '🦵',
    wilayah: 'bawah',
    kenapaTegang:
      'Rectus femoris crosses two joints — hip and knee — so it shortens from sitting and is loaded every time you run or climb stairs.',
    akibat:
      'Pull on the kneecap, producing pain at the front of the knee — especially going down stairs and after sitting a while.',
    stretches: [
      {
        nama: 'Standing quadriceps stretch',
        otot: 'Kuadrisep, terutama rectus femoris',
        posisi: [
          'Stand holding a wall, bend the right knee and take hold of the right ankle',
          'Draw the heel toward the buttock, KEEPING BOTH KNEES IN LINE',
          'Squeeze the glutes and brace the abdomen so the lower back does not arch',
        ],
        terasaDi: 'Depan paha kanan',
        salah:
          'Pulling the knee out to the side or back away from the body, and letting the lower back arch. Both move the stretch out of the muscle and into the knee and lumbar joints.',
        durasi: '30 seconds each side, 2–3 times',
        hatiHati: 'If you feel pain inside the knee, switch to the side-lying or prone version using a towel.',
      },
    ],
  },
  {
    key: 'adduktor',
    nama: 'Inner Thigh (Adductors)',
    ikon: '🔻',
    wilayah: 'bawah',
    kenapaTegang:
      'Sitting with the legs together or crossed for hours means the inner thigh is rarely lengthened. In runners these muscles also work hard to stabilise the pelvis with every stride.',
    akibat: 'Stride narrows, and the risk of a groin strain rises during sudden sideways movement.',
    stretches: [
      {
        nama: 'Seated adductor stretch (butterfly)',
        otot: 'Adduktor pendek',
        posisi: [
          'Sit and bring the soles of both feet together, drawing them in toward you',
          'Sit tall, then hinge forward from the hips',
          'You may press the knees down lightly with your elbows',
        ],
        terasaDi: 'Sisi dalam kedua paha',
        salah: 'Bouncing the knees. Bouncing triggers a reflex that makes the muscle contract instead.',
        durasi: '45 seconds, 2–3 times',
      },
      {
        nama: 'Long adductor stretch (straight leg)',
        otot: 'Gracilis and adductor longus',
        posisi: [
          'Stand with the feet wide apart, toes pointing forward',
          'Bend the right knee and shift your weight to the right, keeping the left leg straight',
        ],
        terasaDi: 'The inner side of the straight left thigh',
        salah: 'Turning the feet outward, which moves the stretch and twists the knee.',
        durasi: '30 seconds each side',
      },
    ],
  },
  {
    key: 'betis',
    nama: 'Calves (Gastrocnemius & Soleus)',
    ikon: '🦶',
    wilayah: 'bawah',
    kenapaTegang:
      'Standing for long periods, walking on hard floors, and shoes with a slight heel all leave the calf sitting shortened. In runners the calf takes the largest repetitive load of any muscle in the leg.',
    akibat:
      'A stiff ankle forces the knee and hip to take over the load, and is one of the most common contributors to heel pain and plantar fasciitis.',
    stretches: [
      {
        nama: 'Wall calf stretch — knee STRAIGHT',
        otot: 'Gastrocnemius',
        posisi: [
          'Face a wall and place both hands on it',
          'Step the right foot well back, heel down, foot pointing straight ahead',
          'KEEP THE RIGHT KNEE STRAIGHT and lean forward',
        ],
        terasaDi: 'The upper, bulkier part of the calf',
        salah: 'Letting the heel lift or the foot turn outward.',
        durasi: '30 seconds each side, 2–3 times',
      },
      {
        nama: 'Wall calf stretch — knee BENT',
        otot: 'Soleus',
        posisi: [
          'The same position, but with a shorter step back',
          'BEND THE BACK KNEE while keeping the heel on the floor',
        ],
        terasaDi: 'The lower calf, close to the Achilles tendon',
        salah:
          'Only doing the straight-knee version. Gastrocnemius crosses the knee, so it slackens the moment the knee bends — and only with the knee bent does soleus actually stretch. Skipping the second version means half the calf is never touched, and it is soleus that is most closely tied to Achilles pain.',
        durasi: '30 seconds each side, 2–3 times',
      },
      {
        nama: 'Sole-of-foot stretch',
        otot: 'Plantar fascia and the small muscles of the sole',
        posisi: [
          'Sit and cross the right foot over the left thigh',
          'Pull the toes back toward the shin until the sole feels taut',
          'Massage gently along the sole with your thumb',
        ],
        terasaDi: 'Along the sole from the heel to the base of the toes',
        salah: 'Skipping it. For anyone on their feet all day this is one of the most noticeably useful movements there is, especially done before the first steps of the morning.',
        durasi: '30 seconds each side, 3 times',
      },
    ],
  },
  {
    key: 'lengan',
    nama: 'Forearms & Wrists',
    ikon: '✍️',
    wilayah: 'atas',
    kenapaTegang:
      'Writing, typing, holding a phone, and gripping instruments for long stretches keep the wrist flexors working without ever being lengthened.',
    akibat:
      'Aching forearms, and with overuse this can develop into pain on the outer or inner side of the elbow.',
    stretches: [
      {
        nama: 'Wrist flexor stretch',
        otot: 'Forearm flexors',
        posisi: [
          'Reach the right arm straight forward, palm facing up',
          'Pull the right fingers down and back with the left hand',
        ],
        terasaDi: 'The inner side of the forearm',
        salah: 'Bending the elbow. It must stay straight for the muscle to actually lengthen.',
        durasi: '30 seconds each side',
      },
      {
        nama: 'Wrist extensor stretch',
        otot: 'Forearm extensors',
        posisi: [
          'Reach the right arm straight forward, palm facing down',
          'Bend the wrist downward and pull gently with the left hand',
        ],
        terasaDi: 'The outer side of the forearm near the elbow',
        salah: 'Pulling too hard when the elbow already hurts — that situation calls for graded strengthening, not stretching.',
        durasi: '30 seconds each side',
      },
    ],
  },
]

// ─── Aturan yang menentukan berhasil atau tidaknya ──────────────────────────

export const STRETCH_RULES: { judul: string; isi: string }[] = [
  {
    judul: 'Do not hold long static stretches before training',
    isi: 'Long static holds immediately before training temporarily reduce strength and power. What you want beforehand is a DYNAMIC warm-up — repeated movement that raises muscle temperature and takes the joints through their range. Static stretching belongs after training, or as its own session at another time.',
  },
  {
    judul: 'Total weekly time is what decides the outcome',
    isi: 'A single ten-second pull changes nothing. Lasting gains in range require roughly five accumulated minutes per muscle group per week. Two 30-second holds, five days a week, already meets that threshold — and it matters far more than how deep the stretch goes.',
  },
  {
    judul: 'A tolerable pull, not pain',
    isi: 'Aim for a clear pull you can still hold while breathing calmly — around 4 to 6 out of 10. Sharp pain is a signal to stop. Stretching into pain makes the muscle contract as a protective reflex, producing the opposite of what you wanted.',
  },
  {
    judul: 'Breathe; do not hold your breath',
    isi: 'Holding your breath raises both muscle tension and blood pressure. Breathe long and slow, and use each exhale to settle a little further.',
  },
  {
    judul: 'Do not bounce',
    isi: 'Bouncing triggers a stretch reflex that makes the muscle contract against you. Besides being less effective, it raises the risk of tearing muscle fibres. Hold still, or use controlled dynamic movement.',
  },
  {
    judul: 'Warm muscle stretches more safely',
    isi: 'Stretching cold muscle first thing out of bed is both less effective and riskier. Five minutes of walking or light movement beforehand is enough.',
  },
  {
    judul: 'Feeling tight does not mean being short',
    isi: 'A WEAK muscle held lengthened produces exactly the same sensation of tightness as a short one. Hamstrings and upper backs in people who sit all day are the most common examples. If you have stretched something for years with no change, what it most likely needs is strengthening, not a harder pull.',
  },
  {
    judul: 'Nerve, not muscle',
    isi: 'Burning, tingling, numbness, or an electric feeling running down a limb means a nerve is being pulled, not a muscle stretched. Pulling further makes it worse. Ease off until the sensation goes, and get it looked at if it persists.',
  },
  {
    judul: 'If your joints are already very mobile, stretch less',
    isi: 'Some people have naturally lax joints. For them, adding flexibility reduces stability and raises injury risk — what they need is strengthening and motor control.',
  },
]

// ─── Pemanasan dinamis (sebelum latihan) ────────────────────────────────────

export interface DynamicMove {
  nama: string
  dosis: string
  cue: string
}

export const DYNAMIC_WARMUP: DynamicMove[] = [
  { nama: 'Brisk walk or very slow jog', dosis: '3–5 minutes', cue: 'The point is to raise muscle temperature first; everything that follows works far better on warm muscle' },
  { nama: 'Front-to-back leg swings', dosis: '10 reps per leg', cue: 'Hold a wall and swing under control; build the range gradually rather than going to full range at once' },
  { nama: 'Side-to-side leg swings', dosis: '10 reps per leg', cue: 'Prepares the adductors and the lateral hip muscles' },
  { nama: 'Walking lunge', dosis: '8 steps per side', cue: 'Lengthens the hip flexor under load — the one thing static stretching does not provide' },
  { nama: 'Arm swings, crossing and opening', dosis: '15 reps', cue: 'Opens the chest and prepares the shoulders' },
  { nama: 'Standing thoracic rotation', dosis: '10 reps per side', cue: 'Hips stay facing forward; only the upper body rotates' },
  { nama: 'Ankle rocking (knee travels past the toes)', dosis: '10 reps per side', cue: 'Prepares the ankle, which governs running mechanics' },
  { nama: 'Light skipping or high knees', dosis: '20–30 seconds', cue: 'Finishes the warm-up with movement that resembles running' },
]

// ─── Rutin siap pakai ───────────────────────────────────────────────────────

export interface Routine {
  key: string
  nama: string
  kapan: string
  durasi: string
  untuk: string
  langkah: string[]
}

export const ROUTINES: Routine[] = [
  {
    key: 'sebelum',
    nama: 'Before training — dynamic',
    kapan: 'Immediately before a run or a strength session',
    durasi: '8–10 minutes',
    untuk: 'Raises muscle temperature and opens range without costing you strength',
    langkah: [
      'Brisk walk or very slow jog, 3–5 minutes',
      'Front-to-back leg swings, 10 per leg',
      'Side-to-side leg swings, 10 per leg',
      'Walking lunges, 8 steps per side',
      'Thoracic rotation, 10 per side',
      'Ankle rocking, 10 per side',
      'Light skipping, 20–30 seconds',
    ],
  },
  {
    key: 'sesudah',
    nama: 'After training — static',
    kapan: 'Within 10 minutes of finishing, while the muscle is still warm',
    durasi: '10–12 minutes',
    untuk: 'Adds range of motion; this is the right time for static stretching',
    langkah: [
      'Calf, knee straight, 30 seconds per side',
      'Calf, knee bent, 30 seconds per side',
      'Lying hamstring with a towel, 30 seconds per side',
      'Kneeling hip flexor, 45 seconds per side',
      'Standing quadriceps, 30 seconds per side',
      'Figure-4, 30 seconds per side',
      'Doorway chest stretch, 30 seconds in each position',
    ],
  },
  {
    key: 'meja',
    nama: 'Work or shift break — 5 minutes',
    kapan: 'Every 30–45 minutes of sitting or standing still',
    durasi: '5 minutes',
    untuk: 'Breaks the slumped pattern before it sets; this matters most for anyone who works long hours on their feet or at a desk',
    langkah: [
      'Stand and walk for 1 minute — the most important step, and the most often skipped',
      'Chin tuck, 10 reps of 5 seconds',
      'Doorway chest stretch, 30 seconds per side',
      'Thoracic extension over a chair back, 5 reps',
      'Kneeling hip flexor, 30 seconds per side if there is room, or a long standing lunge',
      'Wrist flexor stretch, 20 seconds per side',
    ],
  },
  {
    key: 'malam',
    nama: 'Before bed — letting go',
    kapan: 'At night, with no goal of adding flexibility',
    durasi: '8 minutes',
    untuk: 'Lowers tension and helps you get to sleep; keep every stretch light',
    langkah: [
      'Child pose, 60 seconds',
      'Side-bent child pose, 45 seconds per side',
      'Lying figure-4, 45 seconds per side',
      'Open book, 8 reps per side',
      'Sole-of-foot stretch, 30 seconds per side',
      'Lie still with slow belly breathing, 2 minutes',
    ],
  },
]

// ─── Dosis mingguan ─────────────────────────────────────────────────────────

export interface DoseResult {
  perSesiDetik: number
  perMingguDetik: number
  /** Ambang akumulasi yang berkaitan dengan pertambahan lingkup gerak menetap. */
  targetDetik: number
  cukup: boolean
  /** Kekurangan dalam detik; 0 bila sudah cukup. */
  kurangDetik: number
  saran: string
}

export const WEEKLY_TARGET_SEC = 300 // ~5 menit per kelompok otot per minggu

/**
 * Menghitung total waktu regang per kelompok otot per minggu dan
 * membandingkannya dengan ambang yang berkaitan dengan pertambahan lingkup
 * gerak yang menetap. Dibuat sebagai hitungan tersendiri karena inilah angka
 * yang paling sering meleset — orang menambah KEDALAMAN tarikan padahal yang
 * kurang adalah TOTAL WAKTUNYA.
 */
export function stretchDose(holdSec: number, reps: number, sessionsPerWeek: number): DoseResult | null {
  if (!(holdSec > 0) || !(reps > 0) || !(sessionsPerWeek > 0)) return null
  const perSesiDetik = Math.round(holdSec * reps)
  const perMingguDetik = Math.round(perSesiDetik * sessionsPerWeek)
  const kurangDetik = Math.max(0, WEEKLY_TARGET_SEC - perMingguDetik)
  const cukup = kurangDetik === 0

  let saran: string
  if (cukup) {
    saran =
      perMingguDetik >= WEEKLY_TARGET_SEC * 2
        ? 'Well past the threshold. Adding more brings diminishing returns — put that time into strengthening instead.'
        : 'You are meeting the threshold. Keep it there, and resist the temptation to add depth instead.'
  } else {
    const tambahSesi = Math.ceil(kurangDetik / Math.max(perSesiDetik, 1))
    saran = `${Math.round(kurangDetik / 60 * 10) / 10} minutes per week short. The easiest way to close that gap is ${tambahSesi} more session(s) a week, not a deeper pull.`
  }

  return { perSesiDetik, perMingguDetik, targetDetik: WEEKLY_TARGET_SEC, cukup, kurangDetik, saran }
}

/** Format seconds as "3 min 30 s". */
export function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  if (m === 0) return `${s} s`
  return s === 0 ? `${m} min` : `${m} min ${s} s`
}

/** Tanda bahaya yang menuntut pemeriksaan, bukan peregangan lebih lanjut. */
export const RED_FLAGS: string[] = [
  'Tingling, numbness, or an electric sensation running down a leg or arm',
  'Clear muscle weakness — a leg that gives way, or frequent tripping',
  'Pain that wakes you from sleep, or that does not ease with rest',
  'Pain after a sudden injury with swelling, bruising, or an inability to bear weight',
  'Any change in bladder or bowel control appearing alongside back pain',
  'Pain with fever, or unexplained weight loss',
]
