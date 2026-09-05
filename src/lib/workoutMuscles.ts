// Kelompok otot latihan umum -> nama node PERSIS di public/anatomy/muscular.glb
// (diambil dari model Z-Anatomy, lihat Body3D.tsx). Dipakai untuk menyorot
// (highlight hijau) otot yang sedang dilatih saat pengguna memilih target
// latihan, dan untuk mengisi searchTerms pencarian ontologi terkait.
export interface WorkoutMuscleGroup {
  key: string
  label: string
  /** Nama node persis pada muscular.glb (kedua sisi .l/.r sudah termasuk). */
  nodeNames: string[]
  searchTerms: string[]
  /**
   * Penjelasan tertulis. WAJIB ada untuk tiap kelompok, dan sengaja tidak
   * bergantung pada model bahasa: halaman ini sebelumnya menampilkan "No
   * explanation was generated" begitu AI mati atau belum dipasang, sehingga
   * layar kosong pada hal yang justru paling dasar. Isi di bawah selalu
   * tersedia, termasuk saat luring.
   */
  penjelasan: {
    /** Otot apa saja yang termasuk, dengan nama yang dikenal di gym. */
    otot: string
    /** Gerakan yang dihasilkannya — kenapa otot ini ada. */
    aksi: string
    /** Cara melatihnya dan pola gerak yang membebaninya. */
    latihan: string
    /** Cedera dan kesalahan yang lazim, ditulis sebagai sebab-akibat. */
    hatiHati: string
  }
}

export const WORKOUT_MUSCLE_GROUPS: WorkoutMuscleGroup[] = [
  {
    key: 'chest',
    label: 'Chest',
    nodeNames: [
      'Clavicular head of pectoralis major muscle.l', 'Clavicular head of pectoralis major muscle.r',
      'Sternocostal head of pectoralis major muscle.l', 'Sternocostal head of pectoralis major muscle.r',
      '(Abdominal part of pectoralis major muscle).l', '(Abdominal part of pectoralis major muscle).r',
      'Pectoralis minor muscle.l', 'Pectoralis minor muscle.r',
    ],
    searchTerms: ['pectoralis major strain', 'muscle strain'],
    penjelasan: {
      otot: 'Pectoralis major (clavicular, sternal and abdominal heads) and pectoralis minor beneath it.',
      aksi: 'Draws the arm across the body (horizontal adduction), pulls it forward and downward, and rotates it inward. The clavicular head lifts the arm; the sternal head pulls it down — which is why incline and decline work feel different.',
      latihan: 'Any pressing pattern: push-up, bench press, dip, cable fly. Vary the angle rather than only the load — the heads do not all shorten in the same direction.',
      hatiHati: 'Elbows flared to 90° during pressing squeezes the supraspinatus tendon under the acromion. Keep them nearer 45°, and keep the shoulder blades pulled back and down so the joint has a stable base.',
    },
  },
  {
    key: 'back',
    label: 'Back',
    nodeNames: [
      'Latissimus dorsi muscle.l', 'Latissimus dorsi muscle.r',
      'Rhomboid major muscle.l', 'Rhomboid major muscle.r',
      'Rhomboid minor muscle.l', 'Rhomboid minor muscle.r',
      'Descending part of trapezius muscle.l', 'Descending part of trapezius muscle.r',
      'Ascending part of trapezius muscle.l', 'Ascending part of trapezius muscle.r',
      'Transverse part of trapezius muscle.l', 'Transverse part of trapezius muscle.r',
    ],
    searchTerms: ['latissimus dorsi strain', 'trapezius myalgia', 'muscle strain'],
    penjelasan: {
      otot: 'Latissimus dorsi, the rhomboids, and all three parts of trapezius (descending, transverse, ascending).',
      aksi: 'Latissimus pulls the arm down and back — the muscle of a pull-up. Rhomboids and mid-trapezius squeeze the shoulder blades together; lower trapezius pulls them down, which is what makes overhead work safe.',
      latihan: 'Two directions, both needed: vertical pulls (pull-up, lat pulldown) for latissimus, horizontal pulls (row) for rhomboids and mid-trapezius.',
      hatiHati: 'Rounding the lower back under load puts shear force through the discs. Hinge from the hips with a neutral spine and brace before pulling. Starting a pull-up by bending the elbows lets biceps and neck take over — depress the shoulder blades first.',
    },
  },
  {
    key: 'shoulders',
    label: 'Shoulders',
    nodeNames: [
      'Acromial part of deltoid muscle.l', 'Acromial part of deltoid muscle.r',
      'Clavicular part of deltoid muscle.l', 'Clavicular part of deltoid muscle.r',
      'Scapular spinal part of deltoid muscle.l', 'Scapular spinal part of deltoid muscle.r',
      'Supraspinatus muscle.l', 'Supraspinatus muscle.r',
      'Infraspinatus muscle.l', 'Infraspinatus muscle.r',
      'Teres major muscle.l', 'Teres major muscle.r',
      'Teres minor muscle.l', 'Teres minor muscle.r',
    ],
    searchTerms: ['rotator cuff tear', 'shoulder impingement syndrome'],
    penjelasan: {
      otot: 'Deltoid in three parts (anterior, lateral, posterior), plus the four rotator cuff muscles underneath.',
      aksi: 'The deltoid lifts the arm in every direction. The rotator cuff barely lifts anything — its job is to hold the humeral head centred in a very shallow socket while the deltoid pulls.',
      latihan: 'Overhead press for the anterior deltoid, lateral raise for the lateral, reverse fly or face pull for the posterior. Train the cuff with light external rotation, not heavy load.',
      hatiHati: 'The shoulder trades stability for range, so it dislocates more than any other joint. Raising the arm past 90° in a lateral raise pinches the subacromial space. Posterior deltoid and cuff are usually the weak link, and neglecting them is how impingement starts.',
    },
  },
  {
    key: 'biceps',
    label: 'Biceps',
    nodeNames: [
      'Long head of biceps brachii.l', 'Long head of biceps brachii.r',
      'Short head of biceps brachii.l', 'Short head of biceps brachii.r',
      'Brachialis muscle.l', 'Brachialis muscle.r',
    ],
    searchTerms: ['biceps tendinopathy'],
    penjelasan: {
      otot: 'Biceps brachii (long and short heads), brachialis beneath it, and brachioradialis in the forearm.',
      aksi: 'Bends the elbow and supinates the forearm — biceps is the strongest supinator in the body, which is why a screwdriver turns clockwise for a right-handed person.',
      latihan: 'Curls with the palm up load the biceps; hammer and reverse curls shift work to brachialis and brachioradialis. Because the long head crosses the shoulder, arm position changes which part works hardest.',
      hatiHati: 'Swinging the torso to move the weight hands the work to the lower back. The long-head tendon is a common site of tendinopathy in people who press and pull heavily without varying grip.',
    },
  },
  {
    key: 'triceps',
    label: 'Triceps',
    nodeNames: [
      'Long head of triceps brachii.l', 'Long head of triceps brachii.r',
      'Lateral head of triceps brachii.l', 'Lateral head of triceps brachii.r',
      'Medial head of triceps brachii.l', 'Medial head of triceps brachii.r',
    ],
    searchTerms: ['triceps tendinopathy'],
    penjelasan: {
      otot: 'Triceps brachii — long, lateral and medial heads.',
      aksi: 'Straightens the elbow. The long head also crosses the shoulder and pulls the arm backwards, so it is the only head that can be stretched by raising the arm overhead.',
      latihan: 'Any pressing movement trains it. To reach the long head specifically the arm has to be overhead — that is what overhead extensions do and what push-downs cannot.',
      hatiHati: 'Locking out explosively drives the olecranon into its fossa. Finish the movement under control. Deep dips beyond 90° load the anterior shoulder capsule more than the triceps.',
    },
  },
  {
    key: 'forearms',
    label: 'Forearms',
    nodeNames: [
      'Brachioradialis muscle.l', 'Brachioradialis muscle.r',
      'Flexor carpi radialis.l', 'Flexor carpi radialis.r',
      'Extensor carpi radialis longus.l', 'Extensor carpi radialis longus.r',
      'Extensor carpi radialis brevis.l', 'Extensor carpi radialis brevis.r',
      'Humeral head of flexor carpi ulnaris.l', 'Humeral head of flexor carpi ulnaris.r',
      'Humeral head of extensor carpi ulnaris.l', 'Humeral head of extensor carpi ulnaris.r',
    ],
    searchTerms: ['lateral epicondylitis', 'medial epicondylitis'],
    penjelasan: {
      otot: 'The wrist and finger flexors on the palm side and the extensors on the back of the forearm.',
      aksi: 'Flex and extend the wrist and fingers, and control grip. Grip strength is often the first thing that fails in a heavy pull, before the target muscle is anywhere near fatigued.',
      latihan: 'Trained by carrying and hanging more than by curling — farmer\'s walks, dead hangs, thick-bar work. Direct wrist curls add volume but not much carryover.',
      hatiHati: 'Repeated gripping with the wrist extended irritates the common extensor origin at the lateral epicondyle — tennis elbow. It responds to load management and eccentric work, not to rest alone.',
    },
  },
  {
    key: 'abs',
    label: 'Abs',
    nodeNames: [
      'Rectus abdominis muscle.l', 'Rectus abdominis muscle.r',
      'External abdominal oblique muscle.l', 'External abdominal oblique muscle.r',
      'Internal abdominal oblique muscle.l', 'Internal abdominal oblique muscle.r',
      'Transversus abdominis muscle.l', 'Transversus abdominis muscle.r',
    ],
    searchTerms: ['abdominal muscle strain'],
    penjelasan: {
      otot: 'Rectus abdominis, the internal and external obliques, and transversus abdominis beneath them.',
      aksi: 'Flexes and rotates the trunk, and — more importantly — resists movement. Transversus and the obliques stiffen the trunk so force can pass between the legs and the arms without the spine buckling.',
      latihan: 'Anti-movement work matters more than crunches: planks resist extension, side planks resist lateral flexion, Pallof presses resist rotation. Add loaded carries.',
      hatiHati: 'Visible abdominal muscles are a matter of body fat, not of training volume — no amount of crunching reveals them on its own. Repeated loaded flexion is a poor trade for the lumbar discs.',
    },
  },
  {
    key: 'glutes',
    label: 'Glutes',
    nodeNames: [
      'Gluteus maximus muscle.l', 'Gluteus maximus muscle.r',
      'Gluteus medius muscle.l', 'Gluteus medius muscle.r',
      'Gluteus minimus muscle.l', 'Gluteus minimus muscle.r',
    ],
    searchTerms: ['gluteal muscle strain', 'gluteal tendinopathy'],
    penjelasan: {
      otot: 'Gluteus maximus, medius and minimus.',
      aksi: 'Maximus extends the hip — the engine of standing up, climbing and sprinting. Medius and minimus abduct the hip and, crucially, stop the pelvis dropping on the unsupported side during every single step.',
      latihan: 'Maximus: hip thrust, squat, deadlift, step-up. Medius: single-leg work, lateral band walks, side planks with abduction.',
      hatiHati: 'Weak gluteus medius lets the knee fall inward on landing — the mechanism behind a great deal of patellofemoral pain and non-contact ACL injury, especially in women. Prolonged sitting keeps the hip flexors short and the glutes quiet.',
    },
  },
  {
    key: 'quads',
    label: 'Quads',
    nodeNames: [
      'Rectus femoris muscle.l', 'Rectus femoris muscle.r',
      'Vastus lateralis muscle.l', 'Vastus lateralis muscle.r',
      'Vastus medialis muscle.l', 'Vastus medialis muscle.r',
      'Vastus intermedius muscle.l', 'Vastus intermedius muscle.r',
      'Sartorius muscle.l', 'Sartorius muscle.r',
    ],
    searchTerms: ['quadriceps strain', 'patellofemoral pain syndrome'],
    penjelasan: {
      otot: 'Rectus femoris, vastus lateralis, vastus medialis and vastus intermedius.',
      aksi: 'Straighten the knee. Rectus femoris also crosses the hip and flexes it, so it is the only one of the four affected by hip position — which is why leg extensions and squats do not feel the same.',
      latihan: 'Squat, lunge, leg press, step-up. Depth determines how much work the quadriceps do relative to the glutes.',
      hatiHati: 'Knees travelling forward over the toes is normal and safe in a squat; what matters is that they do not collapse inward. Add load only when the pattern holds at the depth you are using.',
    },
  },
  {
    key: 'hamstrings',
    label: 'Hamstrings',
    nodeNames: [
      'Semitendinosus muscle.l', 'Semitendinosus muscle.r',
      'Semimembranosus muscle.l', 'Semimembranosus muscle.r',
      'Long head of biceps femoris.l', 'Long head of biceps femoris.r',
      'Short head of biceps femoris.l', 'Short head of biceps femoris.r',
    ],
    searchTerms: ['hamstring strain'],
    penjelasan: {
      otot: 'Biceps femoris, semitendinosus and semimembranosus.',
      aksi: 'Bend the knee and extend the hip. Because they cross two joints, they can be lengthening at the hip while shortening at the knee in the same stride — which is exactly when they tear.',
      latihan: 'Two patterns, both needed: hip hinge (Romanian deadlift, good morning) and knee flexion (leg curl, Nordic curl). Nordic curls have the best evidence for preventing re-injury.',
      hatiHati: 'Most strains happen in the late swing phase of sprinting, when the muscle is long and braking. Eccentric strength is the protective quality, and it is trained by lengthening under load, not by stretching.',
    },
  },
  {
    key: 'calves',
    label: 'Calves',
    nodeNames: [
      'Lateral head of gastrocnemius.l', 'Lateral head of gastrocnemius.r',
      'Medial head of gastrocnemius.l', 'Medial head of gastrocnemius.r',
      'Soleus muscle.l', 'Soleus muscle.r',
    ],
    searchTerms: ['calf strain', 'achilles tendinopathy'],
    penjelasan: {
      otot: 'Gastrocnemius (two heads, crossing the knee) and soleus beneath it.',
      aksi: 'Point the foot down (plantarflexion) and, in walking and running, absorb landing and return energy through the Achilles tendon.',
      latihan: 'Gastrocnemius is trained with the knee STRAIGHT; soleus with the knee BENT, because gastrocnemius is slackened once the knee flexes. Training only one leaves half the calf untrained.',
      hatiHati: 'The Achilles takes several times body weight each stride. Tendinopathy comes from sudden increases in running volume or hill work, and it responds to gradual loading rather than to rest.',
    },
  },
]
