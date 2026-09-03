// ─────────────────────────────────────────────────────────────────────────────
// Teknik lari — dari kepala sampai kaki, plus fisiologi yang membuat teknik itu
// bertahan sampai kilometer terakhir.
//
// Satu hal yang perlu ditegaskan di depan, karena sebagian besar konten teknik
// lari salah di titik ini: TIDAK ADA satu bentuk lari yang benar untuk semua
// orang. Bukti terbaik yang ada menunjukkan bahwa mengubah gaya lari secara
// paksa — misalnya memaksa mendarat pada ujung kaki — tidak menurunkan risiko
// cedera dan sering memindahkannya (dari lutut ke tendon Achilles dan tulang
// telapak kaki). Yang benar-benar didukung bukti hanya sedikit, dan itulah yang
// ditandai "kuat" di bawah.
//
// Karena itu tiap butir di sini membawa tingkat buktinya sendiri. Menyamakan
// "menaikkan irama langkah 5%" (bukti kuat) dengan "condongkan badan dari
// pergelangan kaki" (kebiasaan pelatih, bukti lemah) akan membuat pembaca
// menghabiskan tenaga pada hal yang salah.
// ─────────────────────────────────────────────────────────────────────────────

export type Bukti = 'kuat' | 'sedang' | 'lemah'

export interface Bagian {
  id: string
  nama: string
  emoji: string
  ringkas: string
  /** Seberapa kuat bukti bahwa mengubah ini membantu. */
  bukti: Bukti
  intinya: string
  langkah: string[]
  kesalahan: string
  latihan: string
  video?: string
  gambar?: string
}

export const LABEL_BUKTI: Record<Bukti, { label: string; warna: string; arti: string }> = {
  kuat: { label: 'Strong evidence', warna: 'text-emerald-700',
    arti: 'Several controlled trials show a benefit. Worth prioritising.' },
  sedang: { label: 'Moderate evidence', warna: 'text-amber-700',
    arti: 'Biomechanically plausible and supported by some research, but not settled.' },
  lemah: { label: 'Coaching tradition', warna: 'text-neutral-500',
    arti: 'Widely taught, but thinly evidenced. Do not change it if your running is comfortable and injury-free.' },
}

export const BAGIAN: Bagian[] = [
  {
    id: 'irama', nama: 'Cadence', emoji: '🥁', bukti: 'kuat',
    ringkas: 'The single best-evidenced adjustment there is',
    intinya: 'Raising steps per minute by roughly 5–10% measurably lowers load on the knee and hip, because each step becomes shorter and lands closer to under the body. It is also the easiest way to fix overstriding without thinking about any body part at all.',
    langkah: [
      'Count the steps of one foot for 30 seconds during an easy run, then multiply by four. That is your current cadence.',
      'Raise it by 5% first — not straight to 180. That number came from observing elite runners in races, not as a target for everyone.',
      'Use a metronome or a track at the target BPM for 5–10 minutes inside an easy run.',
      'Let stride length adjust itself. Do not set it deliberately.',
    ],
    kesalahan: 'Chasing 180 spm when your natural cadence is 158. A jump that large makes running feel unnatural and is usually abandoned within a week.',
    latihan: '4 × 1 minute at +5% cadence, with 2 minutes free cadence between, inside an easy run.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133225_6063efdb-e7da-4556-8524-07130b3a1d14.png',
  },
  {
    id: 'jangkauan', nama: 'Overstriding (stride length)', emoji: '📏', bukti: 'kuat',
    ringkas: 'Landing ahead of the body is braking',
    intinya: 'A foot landing far ahead of the hip with a straight knee creates a braking force on every step — you brake, then push again, hundreds of times per kilometre. A foot landing closer to under the hip removes that force. This is not about a "short" stride; it is about WHERE the foot meets the ground relative to the body.',
    langkah: [
      'Fix it through cadence, not by deliberately shortening your stride.',
      'Feel the heel rise behind you after push-off — a healthy long stride comes from driving backward, not reaching forward.',
      'On climbs the stride shortens by itself; do not fight it.',
    ],
    kesalahan: 'Reaching forward to "lengthen the stride" when you want to go faster. Speed comes from driving backward and from cadence, not from reaching.',
    latihan: '4 × 20 seconds on a gentle downhill at high cadence — the slope forces quick steps without you having to think.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132825_217fde24-e5a4-4959-8f3d-2b13b88b5aa2.png',
  },
  {
    id: 'postur', nama: 'Posture & body position', emoji: '🧍', bukti: 'sedang',
    ringkas: 'Tall, relaxed, leaning slightly from the ankles',
    intinya: 'Stand tall and lengthen, leaning slightly forward from the ANKLES, not the waist. Bending at the waist closes the chest and reduces breathing room; leaning too far back makes the foot land ahead of the body.',
    langkah: [
      'Imagine a string pulling the crown of your head upward; keep the distance between ear and shoulder long.',
      'Look 20–30 metres ahead, not at your shoes.',
      'Neutral pelvis — the tailbone does not stick out behind.',
      'The slight lean comes from the whole body starting at the ankles, not from the waist.',
    ],
    kesalahan: 'Repeatedly looking down at your watch. Each glance closes the chest and breaks your rhythm.',
    latihan: 'Run 30 seconds imagining you are balancing a full glass on your head, every 5 minutes.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132825_2647117a-d0d6-4c64-a656-30c5dfd921c7.png',
  },
  {
    id: 'kaki', nama: 'Foot action & landing', emoji: '🦶', bukti: 'lemah',
    ringkas: 'Do not change this unless you are injured',
    intinya: 'About three quarters of recreational runners land heel first, and that is not a fault. Switching from heel to midfoot or forefoot moves load from the knee to the Achilles tendon and the bones of the foot — it helps some people with knee pain and creates new injuries in others. What actually matters is not which part of the foot touches down, but WHERE the foot lands relative to the hip.',
    langkah: [
      'Leave your footstrike alone unless you have recurring pain that a clinician has assessed.',
      'If it does need changing, do it gradually over 8–12 weeks, not at once.',
      'Fix where you land (through cadence) before thinking about which part of the foot touches.',
    ],
    kesalahan: 'Switching to forefoot landing within a week of watching one video. Achilles injury and metatarsal stress fractures are the usual result.',
    latihan: 'Run barefoot 4 × 30 seconds on safe grass — it gives natural feedback without forcing a change.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132546_46927bfd-dcb5-459e-9778-59d19c0426c3.mp4',
  },
  {
    id: 'lengan', nama: 'Arm action', emoji: '💪', bukti: 'sedang',
    ringkas: 'Balancing the legs, not propelling the body',
    intinya: 'Your arms do not make you faster directly; their job is to damp the trunk rotation the legs create. A swing that crosses the chest forces the torso to rotate, and the hips counter-rotate against it — energy spent fighting yourself.',
    langkah: [
      'Elbows bent to about 90 degrees, and kept there.',
      'Swing from the SHOULDER, forward and back, without crossing the midline of the chest.',
      'Hands relaxed, as if holding a crisp without crushing it.',
      'Shoulders down and away from the ears. Check every few kilometres — they creep up as you tire.',
    ],
    kesalahan: 'Clenching the fists and hiking the shoulders when tired. It burns energy without adding any speed at all.',
    latihan: 'Run 1 minute with the hands deliberately loose and open, and notice the difference in your shoulders.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132546_f809197f-3183-4982-bbc3-278389826065.mp4',
  },
  {
    id: 'napas', nama: 'Breathing & technique', emoji: '🫁', bukti: 'sedang',
    ringkas: 'From the belly, through the mouth, in rhythm',
    intinya: 'Shallow chest breathing recruits the neck and shoulder muscles — expensive and inefficient. Diaphragmatic breathing (the belly expanding) moves more air for less effort. The mouth is allowed and should be used: the nose alone is not enough above easy intensity.',
    langkah: [
      'Lie down with one hand on the chest and one on the belly; practise until only the belly hand rises. 5 minutes a day.',
      'On easy runs use a 3:3 pattern (three steps in, three steps out).',
      'For tempo drop to 2:2. For intervals, 2:1 or whatever happens naturally.',
      'Breathe out for longer than you breathe in when panic starts — that lowers the heart rate faster than taking deep breaths in.',
    ],
    kesalahan: 'Unconsciously holding your breath on climbs. Watch for it — very common, and it makes the legs feel heavy immediately.',
    latihan: 'Diaphragmatic breathing 5 minutes before bed; the 3:3 pattern for the first 10 minutes of every easy run.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133020_bee9d699-8539-4279-ac9a-f930d423afb1.png',
  },
  {
    id: 'start', nama: 'Positioning & how to start', emoji: '🚦', bukti: 'kuat',
    ringkas: 'The first ten minutes decide the rest',
    intinya: 'Starting too fast is the most expensive mistake in distance running, and the most common. The muscles are not warm, the heart rate has not settled, and the oxygen debt built in the first five minutes has to be repaid across the rest of the run.',
    langkah: [
      'Brisk walk for 3–5 minutes, then dynamic movement (leg swings, rotating lunges).',
      'Start the run 5–10 minutes SLOWER than target pace. It will feel too slow — that is exactly right.',
      'For a race: 4–6 short 20-second accelerations before the start, then settle.',
      'The first kilometre of a race should be 5–10 seconds slower than target pace, not faster.',
    ],
    kesalahan: 'Getting swept along with the pack in the first 500 metres of a race. Almost everybody pays for it in the final kilometre.',
    latihan: 'Practise a "negative split": run the second half faster than the first, once a week.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133020_61c28730-5b8a-433e-96f0-71dd168daeb3.png',
  },
  {
    id: 'aero', nama: 'Aerodynamics & air resistance', emoji: '💨', bukti: 'sedang',
    ringkas: 'It only matters when you are fast or it is windy',
    intinya: 'Air resistance rises with the square of speed, so at 6:00/km it barely matters — around 2% of your effort. At 3:30/km, or into a strong headwind, it can exceed 8%. Running just behind somebody (drafting) removes most of that, and the effect is measurable rather than imagined.',
    langkah: [
      'Into a headwind, find a runner ahead and sit about a metre behind them.',
      'Close-fitting clothing helps; a loose jacket flaps and adds drag.',
      'Do not duck your head to "cut through the wind" — it closes the chest and costs more than it saves.',
      'On easy runs, ignore it completely. Your attention is better spent elsewhere.',
    ],
    kesalahan: 'Thinking about aerodynamics on a relaxed run. At that speed, posture and breathing matter far more.',
    latihan: 'On a windy day, run the return leg into the wind — you are warm by then and can feel the difference.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133225_8f375cc1-a8a3-435d-9335-c0ef2d519ea1.png',
  },
]

export interface Fisiologi {
  id: string
  judul: string
  emoji: string
  pertanyaan: string
  jawaban: string
  aturan: string[]
}

export const FISIOLOGI: Fisiologi[] = [
  {
    id: 'kuantitas', judul: 'Quantity — how much', emoji: '📊',
    pertanyaan: 'How many kilometres a week?',
    jawaban: 'Volume is the single largest driver of endurance: it increases capillaries, mitochondria, and aerobic enzymes in muscle. But those adaptations happen in tissues that adapt at different rates — heart and lungs adjust in weeks, tendon and bone in months. Running injuries almost always come from the gap between those rates, not from high volume itself.',
    aturan: [
      'Raise the weekly total by at most 10% over the previous week, and not every week.',
      'Every fourth week, drop volume by 20–30%. The adaptation happens in that easy week, not in the hard ones.',
      'A single long run should not exceed 30–35% of the weekly total.',
      'Add sessions before adding distance per session.',
    ],
  },
  {
    id: 'kualitas', judul: 'Quality — how hard', emoji: '🔥',
    pertanyaan: 'How many hard sessions?',
    jawaban: 'The runners who train the most run about 80% of it easy — slow enough to speak a full sentence. The other 20% is genuinely hard. What costs you is the middle: hard enough to tire you, not hard enough to trigger speed adaptation. Most recreational runners spend the bulk of their time there.',
    aturan: [
      'Two quality sessions a week at most, whatever your level.',
      'An easy run should feel TOO easy. If it does not, it is not an easy run.',
      'Never two hard sessions back to back. Leave at least 48 hours between them.',
      'When torn between easy and moderate, choose easy.',
    ],
  },
  {
    id: 'durasi', judul: 'Duration — how long',  emoji: '⏱️',
    pertanyaan: 'How long should the long run be?',
    jawaban: 'The long run trains what short sessions cannot: the ability to burn fat as fuel, tendon durability, and the mental readiness for the closing hours. But the benefit comes from TIME ON FEET rather than distance — so for a slower runner, a time target fits better than a kilometre target.',
    aturan: [
      'Start at 60–75 minutes and add 10 minutes every two weeks.',
      'For a marathon, a longest run of 2.5–3 hours is enough; beyond that, fatigue accumulates faster than fitness.',
      'Run it at easy pace, not race pace. A long run taken too fast ruins that week’s quality session.',
      'Fuel after 75 minutes: 30–60 grams of carbohydrate per hour.',
    ],
  },
  {
    id: 'pemulihan', judul: 'Recovery — when adaptation happens', emoji: '😴',
    pertanyaan: 'Why am I not improving despite the work?',
    jawaban: 'Training only provides the stimulus; the fitness is built while you sleep. Short sleep lowers muscle protein synthesis, raises stress hormones, and lengthens recovery. Adding sessions while cutting sleep almost always produces a worse result than training less and sleeping properly.',
    aturan: [
      'Sleep 7–9 hours. This is part of the training programme, not an accessory to it.',
      'Muscle soreness still present after 72 hours means the previous session was too hard.',
      'A resting heart rate 5+ bpm above normal is a signal to choose an easy session.',
      'A full week off every 12–16 weeks does not cost you fitness — it lets tendons recover.',
    ],
  },
]

export const RUJUKAN_LARI = [
  'Schubert AG, Kempf J, Heiderscheit BC. Influence of stride frequency and length on running mechanics. Sports Health. 2014;6(3):210-217.',
  'Anderson LM, dkk. What are the benefits and risks associated with changing foot strike pattern during running? Sports Med. 2020;50(5):885-917.',
  'Seiler S. What is best practice for training intensity and duration distribution in endurance athletes? Int J Sports Physiol Perform. 2010;5(3):276-291.',
  'Nielsen RO, dkk. Training errors and running related injuries: a systematic review. Int J Sports Phys Ther. 2012;7(1):58-75.',
  'Pugh LGCE. The influence of wind resistance in running and walking. J Physiol. 1971;213(2):255-276.',
]
