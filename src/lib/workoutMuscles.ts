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
    searchTerms: ['pectoral muscle', 'chest pain'],
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
    searchTerms: ['back pain', 'muscular back pain'],
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
    searchTerms: ['rotator cuff', 'shoulder pain'],
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
    searchTerms: ['forearm pain', 'tennis elbow'],
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
  },
  {
    key: 'glutes',
    label: 'Glutes',
    nodeNames: [
      'Gluteus maximus muscle.l', 'Gluteus maximus muscle.r',
      'Gluteus medius muscle.l', 'Gluteus medius muscle.r',
      'Gluteus minimus muscle.l', 'Gluteus minimus muscle.r',
    ],
    searchTerms: ['gluteal muscle strain', 'hip pain'],
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
    searchTerms: ['quadriceps strain', 'knee pain'],
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
  },
]
