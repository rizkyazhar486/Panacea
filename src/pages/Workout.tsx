import { useMemo, useState } from 'react'
import { Card, SectionTitle, Button, Badge, inputClass } from '../components/ui'
import { IconActivity, IconFlame, IconRun, IconCheck, IconPlus } from '../components/icons'
import { VideoGallery } from '../components/VideoGallery'

type Muscle = 'Dada' | 'Punggung' | 'Bahu' | 'Lengan' | 'Kaki' | 'Glute' | 'Core' | 'Full Body'
type Modality =
  | 'Strength' | 'Muscle Gain' | 'Tone & Shape' | 'Cardio' | 'Endurance' | 'HIIT' | 'Fat Loss'
  | 'Mobility' | 'Agility' | 'Balance & Coordination' | 'Core' | 'Kettlebell' | 'Muay Thai / Martial Arts'
  | 'Battling Ropes' | 'Post Natal Shaping' | 'Focus & Movement' | 'Muscle Memory'

interface Exercise {
  id: string
  name: string
  muscle: Muscle
  type: 'Calisthenic' | 'Alat'
  mode: 'Statis' | 'Dinamis'
  modalities: Modality[]
  description: string
  cue: string // clinical/orthopedic cue — load, joint position, common compensation
  nutrition: string
}

const EX: Exercise[] = [
  { id: 'pushup', name: 'Push-Up', muscle: 'Dada', type: 'Calisthenic', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape', 'Core'],
    description: 'Posisi plank, tangan selebar bahu sedikit lebih lebar. Turunkan badan dengan siku membentuk sudut ~45° terhadap badan (bukan melebar 90°) hingga dada mendekati lantai, lalu dorong kembali ke atas hingga siku hampir lurus tanpa hyperextend.',
    cue: 'Pertahankan korset bahu (scapular retraction-protraction terkontrol) untuk mencegah impingement subakromial; aktifkan core agar lumbar tidak hiperekstensi (hindari "sagging hips"). Beban relatif = massa tubuh × % yang ditopang lengan (~64% saat plank standar).',
    nutrition: 'Protein 1.6-2.2g/kgBB/hari untuk sintesis protein otot (MPS); leusin dari telur/dada ayam/whey membantu memicu mTOR pathway.' },
  { id: 'benchpress', name: 'Bench Press (Barbel)', muscle: 'Dada', type: 'Alat', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain'],
    description: 'Berbaring di bench, grip sedikit lebih lebar dari bahu. Turunkan barbel terkontrol ke garis puting/sternum bawah, siku ~45-75° dari badan, lalu dorong vertikal hingga lengan lurus.',
    cue: 'Hindari elbow flare 90° (risiko impingement & strain labrum anterior); jaga scapula tertarik & turun (retracted-depressed) sepanjang gerakan untuk stabilitas glenohumeral. Progressive overload 2.5-5%/minggu jika RPE <8.',
    nutrition: 'Surplus kalori ringan (+250-500 kkal) bila tujuan hipertrofi; karbohidrat kompleks pre-workout untuk performa angkat maksimal.' },
  { id: 'pullup', name: 'Pull-Up', muscle: 'Punggung', type: 'Calisthenic', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape'],
    description: 'Gantung pada bar, grip overhand selebar bahu. Tarik badan hingga dagu melewati bar dengan menarik siku ke bawah-belakang (lat-driven), lalu turun terkontrol hingga lengan lurus penuh (full dead hang).',
    cue: 'Mulai dari scapular depression sebelum fleksi siku ("scap pull-up" pattern) untuk melatih lower trapezius & mencegah dominasi bisep/leher. Hindari kipping berlebihan pada pemula (risiko cedera bahu).',
    nutrition: 'Kreatin monohidrat 3-5g/hari dapat membantu output kekuatan repetisi tinggi; cukupi hidrasi 35ml/kgBB.' },
  { id: 'row', name: 'Bent-Over Row (Dumbbell/Barbel)', muscle: 'Punggung', type: 'Alat', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape'],
    description: 'Hip hinge dengan punggung netral, badan ~45° condong ke depan. Tarik beban ke arah perut bawah/pinggang dengan menjepit skapula, turun terkontrol.',
    cue: 'Pertahankan netral spine (hindari fleksi lumbal di bawah beban — risiko disc shear force tinggi); core brace sebelum menarik.',
    nutrition: 'Magnesium & kalium cukup (sayur hijau, pisang) untuk fungsi kontraksi otot optimal dan mencegah kram.' },
  { id: 'ohp', name: 'Overhead Press', muscle: 'Bahu', type: 'Alat', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain', 'Core'],
    description: 'Berdiri, beban di depan bahu. Dorong vertikal lurus ke atas hingga lengan lurus di atas kepala, kepala sedikit maju saat beban melewati wajah, turun terkontrol.',
    cue: 'Butuh mobilitas thoracic extension & scapular upward rotation adekuat; hindari lumbar hyperextension kompensatori (brace core, jangan "bankir" pinggang).',
    nutrition: 'Vitamin D & kalsium untuk kesehatan tulang sendi bahu (sun exposure 10-15 menit/hari atau suplemen sesuai anjuran dokter).' },
  { id: 'lateralraise', name: 'Lateral Raise', muscle: 'Bahu', type: 'Alat', mode: 'Dinamis', modalities: ['Tone & Shape', 'Muscle Gain'],
    description: 'Berdiri, dumbbell di samping badan. Angkat lengan ke samping hingga setinggi bahu (bukan lebih), siku sedikit ditekuk, turun terkontrol.',
    cue: 'Batasi elevasi >90° untuk hindari impingement subakromial; gunakan beban moderat-ringan repetisi tinggi karena lever arm panjang meningkatkan torsi sendi.',
    nutrition: 'Omega-3 (ikan berlemak) membantu kontrol inflamasi tendon rotator cuff pasca-latihan repetitif.' },
  { id: 'dip', name: 'Dips', muscle: 'Lengan', type: 'Calisthenic', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape'],
    description: 'Tangan di parallel bar, badan tegak (untuk trisep) atau condong (untuk dada). Turun hingga siku ~90°, dorong kembali ke atas.',
    cue: 'Batasi kedalaman jika ada riwayat instabilitas bahu (depth >90° meningkatkan stress anterior capsule); jaga bahu tetap depressed.',
    nutrition: 'Protein cepat cerna (whey/telur) pasca-latihan dalam window 1-2 jam untuk memaksimalkan recovery.' },
  { id: 'curl', name: 'Bicep Curl', muscle: 'Lengan', type: 'Alat', mode: 'Dinamis', modalities: ['Muscle Gain', 'Tone & Shape'],
    description: 'Berdiri, dumbbell di tangan, siku menempel di sisi badan. Tekuk siku mengangkat beban ke bahu, kontraksi penuh, turun terkontrol (eccentric 2-3 detik).',
    cue: 'Hindari momentum/swing (mengurangi tension otot target & membebani lumbar); fokus tempo lambat fase eksentrik untuk hipertrofi optimal (time under tension).',
    nutrition: 'Karbohidrat sedang + protein pasca-latihan untuk replenish glikogen & MPS.' },
  { id: 'squat', name: 'Squat (Bodyweight/Barbel)', muscle: 'Kaki', type: 'Alat', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain', 'Fat Loss', 'Mobility'],
    description: 'Kaki selebar bahu, turunkan pinggul ke belakang-bawah seperti duduk hingga paha sejajar lantai (atau lebih dalam jika mobilitas memadai), dada tetap tegak, dorong melalui tumit untuk berdiri.',
    cue: 'Lutut sejajar arah jari kaki (hindari valgus collapse — faktor risiko ACL/PFPS); jaga lumbar netral, hindari "butt wink" berlebihan di titik terdalam.',
    nutrition: 'Karbohidrat kompleks pre-workout (oatmeal/nasi merah) untuk energi gerakan compound besar; cukupi kalium untuk fungsi otot kaki.' },
  { id: 'lunge', name: 'Lunge', muscle: 'Kaki', type: 'Calisthenic', mode: 'Dinamis', modalities: ['Balance & Coordination', 'Tone & Shape', 'Mobility'],
    description: 'Langkah satu kaki ke depan, turunkan pinggul hingga kedua lutut ~90°, lutut belakang hampir menyentuh lantai, dorong kembali ke posisi awal.',
    cue: 'Lutut depan tidak melewati ujung jari kaki secara berlebihan jika ada riwayat patellofemoral pain; latih unilateral untuk koreksi asimetri kekuatan kanan-kiri.',
    nutrition: 'Hidrasi optimal mendukung kontrol neuromuskular & keseimbangan selama gerakan unilateral.' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Glute', type: 'Alat', mode: 'Dinamis', modalities: ['Strength', 'Muscle Gain', 'Core'],
    description: 'Kaki selebar pinggul, barbel dekat tulang kering. Hip hinge, punggung netral, angkat dengan mendorong lantai melalui kaki & meluruskan pinggul bersamaan dengan lutut.',
    cue: 'Spine netral wajib sepanjang gerakan (flexed-spine lifting = risiko herniasi diskus tertinggi pada compound lift); bar path vertikal dekat tubuh.',
    nutrition: 'Protein tinggi & natrium-elektrolit cukup; ini gerakan paling demanding secara sistemik — recovery tidur 7-9 jam penting.' },
  { id: 'hipthrust', name: 'Hip Thrust', muscle: 'Glute', type: 'Alat', mode: 'Dinamis', modalities: ['Strength', 'Tone & Shape', 'Post Natal Shaping'],
    description: 'Punggung atas di bench, kaki menapak lantai. Dorong pinggul ke atas melalui tumit hingga badan lurus (full hip extension), kontraksi glute di puncak, turun terkontrol.',
    cue: 'Hindari lumbar hyperextension di puncak — fokus posterior pelvic tilt + kontraksi glute, bukan ekstensi lumbal. Aman & direkomendasikan untuk rehabilitasi diastasis recti pasca-natal dengan beban progresif rendah.',
    nutrition: 'Protein cukup untuk regenerasi jaringan ikat panggul, khususnya pada program post-natal shaping.' },
  { id: 'plank', name: 'Plank', muscle: 'Core', type: 'Calisthenic', mode: 'Statis', modalities: ['Core', 'Strength', 'Post Natal Shaping'],
    description: 'Tumpu pada lengan bawah & ujung kaki, badan membentuk garis lurus dari kepala hingga tumit. Tahan posisi dengan core, glute, dan paha aktif berkontraksi isometrik.',
    cue: 'Hindari pinggul turun (lumbar sagging) atau naik berlebihan (hip hiking); ini latihan isometrik aman pasca-natal untuk memulihkan tekanan intra-abdominal & diastasis recti sebelum progresif ke gerakan dinamis.',
    nutrition: 'Tidak ada kebutuhan kalori spesifik tinggi; fokus stabilitas glikemik agar fokus & kontrol motorik optimal selama tahanan statis.' },
  { id: 'hollow', name: 'Hollow Body Hold', muscle: 'Core', type: 'Calisthenic', mode: 'Statis', modalities: ['Core', 'Focus & Movement', 'Muscle Memory'],
    description: 'Berbaring telentang, angkat bahu & kaki sedikit dari lantai, punggung bawah menempel lantai (posterior pelvic tilt), tahan posisi dengan napas terkontrol.',
    cue: 'Indikator teknik benar = lumbar tetap menempel lantai (tidak ada gap); jika lumbar terangkat berarti beban berlebih bagi kapasitas core saat ini — regresi dengan menekuk lutut.',
    nutrition: 'Latihan kontrol motorik & memori otot diuntungkan oleh tidur cukup (konsolidasi motor learning terjadi saat tidur dalam/REM).' },
  { id: 'burpee', name: 'Burpee', muscle: 'Full Body', type: 'Calisthenic', mode: 'Dinamis', modalities: ['HIIT', 'Cardio', 'Fat Loss', 'Endurance'],
    description: 'Dari berdiri, jongkok-tangan ke lantai, lompat kaki ke posisi plank, push-up (opsional), lompat kaki kembali ke jongkok, lalu melompat vertikal dengan tangan ke atas.',
    cue: 'Latihan compound intensitas tinggi — pantau teknik landing (lutut lentur, bukan kaku) untuk mengurangi gaya impact pada sendi lutut/ankle; hindari pada kondisi sendi akut.',
    nutrition: 'Defisit kalori moderat (300-500 kkal) efektif dikombinasi HIIT untuk fat loss; cukupi karbohidrat agar intensitas terjaga selama interval.' },
  { id: 'kettlebellswing', name: 'Kettlebell Swing', muscle: 'Full Body', type: 'Alat', mode: 'Dinamis', modalities: ['Kettlebell', 'Cardio', 'Endurance', 'Fat Loss', 'Strength'],
    description: 'Kaki selebar bahu, kettlebell di depan. Hip hinge mengayun kettlebell ke belakang di antara paha, lalu dorong pinggul ke depan eksplosif (hip drive) hingga kettlebell terangkat ke ketinggian dada — bukan diangkat dengan bahu/lengan.',
    cue: 'Power dihasilkan dari ballistic hip extension, bukan fleksi lumbal berulang; pastikan spine netral sepanjang gerakan untuk hindari cedera lumbal akibat repetisi tinggi.',
    nutrition: 'Latihan metabolic conditioning tinggi — pastikan glikogen otot cukup (karbohidrat pre-workout) & elektrolit untuk sesi >15 menit.' },
  { id: 'kettlebellgoblet', name: 'Kettlebell Goblet Squat', muscle: 'Kaki', type: 'Alat', mode: 'Dinamis', modalities: ['Kettlebell', 'Mobility', 'Strength'],
    description: 'Pegang kettlebell di depan dada (goblet position), squat dalam dengan siku di antara lutut, dorong kembali berdiri.',
    cue: 'Posisi goblet membantu menjaga torso tegak & memperbaiki kedalaman squat secara aman — baik untuk melatih mobilitas pinggul/ankle sebelum progres ke barbel squat.',
    nutrition: 'Sama seperti squat — karbohidrat kompleks pre-workout.' },
  { id: 'battlerope', name: 'Battling Ropes (Alternating Waves)', muscle: 'Full Body', type: 'Alat', mode: 'Dinamis', modalities: ['Battling Ropes', 'HIIT', 'Cardio', 'Fat Loss', 'Endurance'],
    description: 'Berdiri posisi athletic stance (lutut sedikit ditekuk, core aktif), pegang ujung rope tiap tangan, hentakkan rope bergantian naik-turun secara cepat & ritmis selama interval waktu (mis. 20-30 detik kerja).',
    cue: 'Stabilitas core & posisi lutut penting untuk transfer gaya dari lengan ke tanah tanpa membebani lumbar; gerakan ini high-intensity metabolic & low-impact pada sendi (cocok untuk obesitas/cedera lutut ringan).',
    nutrition: 'HIIT metabolic conditioning — efektif untuk EPOC (excess post-exercise oxygen consumption) tinggi, mendukung fat loss; cukupi protein pasca-sesi.' },
  { id: 'muaythaikick', name: 'Teknik Tendangan (Muay Thai — Roundhouse Kick)', muscle: 'Full Body', type: 'Calisthenic', mode: 'Dinamis', modalities: ['Muay Thai / Martial Arts', 'Balance & Coordination', 'Agility', 'Cardio'],
    description: 'Pivot kaki tumpu 90° searah tendangan, putar pinggul penuh sambil mengangkat lutut kaki tendang ke samping, luruskan tungkai bawah melalui kontak menggunakan tulang kering (shin), lengan menjaga guard di wajah.',
    cue: 'Power berasal dari rotasi pinggul (hip rotation), bukan hanya otot tungkai — kurangi risiko strain hip flexor/adductor dengan pemanasan dinamis rotasi pinggul sebelum sesi.',
    nutrition: 'Latihan teknik & koordinasi tinggi — gula darah stabil penting untuk fokus & reaksi (hindari makan berat <1 jam sebelum sparring).' },
  { id: 'shadowbox', name: 'Shadow Boxing / Pad Work', muscle: 'Full Body', type: 'Calisthenic', mode: 'Dinamis', modalities: ['Muay Thai / Martial Arts', 'Cardio', 'Endurance', 'Balance & Coordination', 'Agility', 'Focus & Movement'],
    description: 'Footwork ringan menjaga jarak, lempar kombinasi pukulan (jab-cross-hook) dengan rotasi pinggul & bahu, kembali ke guard setelah tiap pukulan.',
    cue: 'Latih neuromuscular coordination & reaction time; rotasi trunk yang baik mengurangi beban berlebih pada bahu dominan saat repetisi tinggi.',
    nutrition: 'Cardio-dominan — karbohidrat cukup untuk sesi >20 menit; hidrasi aktif tiap interval.' },
  { id: 'jumprope', name: 'Lompat Tali (Jump Rope)', muscle: 'Full Body', type: 'Alat', mode: 'Dinamis', modalities: ['Cardio', 'Agility', 'Balance & Coordination', 'Endurance', 'Fat Loss'],
    description: 'Lompat ringan dengan pergelangan kaki (bukan lutut tinggi), tali diputar dari pergelangan tangan, irama konsisten.',
    cue: 'Latihan low-amplitude jump mengurangi impact lutut dibanding lompat tinggi; baik untuk plyometric ringan & agility kaki.',
    nutrition: 'Cardio kontinyu — pastikan tidak dalam kondisi puasa berkepanjangan untuk menjaga performa & menghindari hipoglikemia ringan.' },
  { id: 'mobilitydrill', name: 'Hip & Thoracic Mobility Flow', muscle: 'Full Body', type: 'Calisthenic', mode: 'Statis', modalities: ['Mobility', 'Focus & Movement', 'Balance & Coordination'],
    description: 'Rangkaian gerakan: cat-cow, hip circles 90/90, thoracic rotation, world\'s greatest stretch — tiap posisi ditahan/diulang perlahan dengan napas dalam.',
    cue: 'Mobilitas adekuat di hip & thoracic spine mengurangi kompensasi berlebih di lumbar saat squat/deadlift/overhead press — lakukan sebagai warm-up dinamis sebelum sesi beban.',
    nutrition: 'Tidak terkait kalori langsung; cukupi cairan agar jaringan fascia/otot lebih elastis.' },
  { id: 'postnatalbreath', name: 'Diaphragmatic Breathing + Pelvic Floor Activation', muscle: 'Core', type: 'Calisthenic', mode: 'Statis', modalities: ['Post Natal Shaping', 'Core', 'Mobility'],
    description: 'Berbaring, tangan di perut, tarik napas dalam mengembangkan perut & rusuk bawah (bukan dada), saat menghembuskan napas kontraksikan dasar panggul (seperti menahan kencing) bersamaan transversus abdominis.',
    cue: 'Fase wajib sebelum progres ke plank/hip thrust pasca-melahirkan — terutama bila ada diastasis recti atau disfungsi dasar panggul; konsultasi fisioterapi obstetri bila ada coning/bulging di garis tengah perut saat latihan.',
    nutrition: 'Protein & zat besi cukup untuk recovery jaringan pasca-persalinan; hindari defisit kalori agresif selama menyusui.' },
]

const MUSCLES: Muscle[] = ['Dada', 'Punggung', 'Bahu', 'Lengan', 'Kaki', 'Glute', 'Core', 'Full Body']
const MODALITIES: Modality[] = ['Strength', 'Muscle Gain', 'Tone & Shape', 'Cardio', 'Endurance', 'HIIT', 'Fat Loss', 'Mobility', 'Agility', 'Balance & Coordination', 'Core', 'Kettlebell', 'Muay Thai / Martial Arts', 'Battling Ropes', 'Post Natal Shaping', 'Focus & Movement', 'Muscle Memory']

interface LogEntry { id: string; exId: string; date: string; sets: number; reps: number; weight: number }
const LOG_KEY = 'pm_workout_log'
function loadLog(): LogEntry[] { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') } catch { return [] } }
function saveLog(l: LogEntry[]) { try { localStorage.setItem(LOG_KEY, JSON.stringify(l)) } catch { /* ignore */ } }

export function Workout() {
  const [muscle, setMuscle] = useState<Muscle | 'Semua'>('Semua')
  const [modality, setModality] = useState<Modality | 'Semua'>('Semua')
  const [type, setType] = useState<'Semua' | 'Calisthenic' | 'Alat'>('Semua')
  const [open, setOpen] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>(loadLog)
  const [sets, setSets] = useState(3); const [reps, setReps] = useState(12); const [weight, setWeight] = useState(0)

  const filtered = useMemo(() => EX.filter((e) =>
    (muscle === 'Semua' || e.muscle === muscle) &&
    (modality === 'Semua' || e.modalities.includes(modality)) &&
    (type === 'Semua' || e.type === type),
  ), [muscle, modality, type])

  function logExercise(exId: string) {
    const entry: LogEntry = { id: `${Date.now()}`, exId, date: new Date().toISOString().slice(0, 10), sets, reps, weight }
    const next = [entry, ...log]
    setLog(next); saveLog(next)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayLog = log.filter((l) => l.date === todayStr)
  const weekLog = log.filter((l) => Date.now() - new Date(l.date).getTime() <= 7 * 86400000)
  const weeklyVolume = weekLog.reduce((a, l) => a + l.sets * l.reps * (l.weight || 1), 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <VideoGallery
        icon={<IconFlame size={20} />}
        title="Video Contoh Gerakan"
        subtitle="Demonstrasi form yang benar — pemanasan, HIIT & kaki"
        videos={[
          { label: 'Pemanasan Dinamis', cue: 'Leg swing · arm circle · high knees — wajib sebelum sesi', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_073037_fc3668ff-bc44-4938-8e63-69f2ba59c7f9.mp4' },
          { label: 'Burpee', cue: 'Squat → plank → push-up → lompat eksplosif, jaga form saat lelah', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_072933_8c31ec59-1c8a-46a2-8e05-03b56cd36e5f.mp4' },
          { label: 'Lunge', cue: 'Torso tegak · lutut depan 90° searah jari kaki', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_072947_e56eb38e-4fea-4d36-aed8-0baf8e10b1f5.mp4' },
        ]}
      />

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="AI Program — Workout Tracker" subtitle="Statis & dinamis, alat maupun calisthenic, per kelompok otot — dasar sport science & orthopedic" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select className={inputClass} value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle | 'Semua')}>
            <option value="Semua">Semua Otot</option>
            {MUSCLES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className={inputClass} value={modality} onChange={(e) => setModality(e.target.value as Modality | 'Semua')}>
            <option value="Semua">Semua Tujuan</option>
            {MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="Semua">Calisthenic & Alat</option>
            <option value="Calisthenic">Calisthenic</option>
            <option value="Alat">Dengan Alat</option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-extrabold text-ink">{todayLog.length}</div>
            <div className="text-[10px] text-neutral-400">Set hari ini</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-extrabold text-ink">{weekLog.length}</div>
            <div className="text-[10px] text-neutral-400">Sesi minggu ini</div>
          </div>
          <div className="rounded-xl bg-brand-50 p-3 text-center">
            <div className="text-lg font-extrabold text-brand-dark">{weeklyVolume.toLocaleString('id-ID')}</div>
            <div className="text-[10px] text-neutral-400">Volume mingguan</div>
          </div>
        </div>
      </Card>

      <div className="space-y-2.5">
        {filtered.map((e) => (
          <Card key={e.id} className="!p-4">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === e.id ? null : e.id)}>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  {e.name}
                  <Badge tone={e.type === 'Calisthenic' ? 'brand' : 'neutral'}>{e.type}</Badge>
                  <Badge tone="neutral">{e.mode}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">{e.muscle}</span>
                  {e.modalities.slice(0, 3).map((m) => <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">{m}</span>)}
                </div>
              </div>
              <IconActivity size={16} className={open === e.id ? 'text-brand' : 'text-neutral-300'} />
            </button>

            {open === e.id && (
              <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Cara Melakukan</div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{e.description}</p>
                </div>
                <div className="rounded-xl bg-amber-50/60 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Catatan Klinis & Orthopedic</div>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">{e.cue}</p>
                </div>
                <div className="rounded-xl bg-brand-50/60 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">Penyesuaian Nutrisi</div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700">{e.nutrition}</p>
                </div>

                <div className="flex flex-wrap items-end gap-2 rounded-xl border border-neutral-100 p-3">
                  <label className="text-xs">Set<input className={inputClass + ' mt-1 w-16'} type="number" value={sets} onChange={(ev) => setSets(+ev.target.value)} /></label>
                  <label className="text-xs">Reps<input className={inputClass + ' mt-1 w-16'} type="number" value={reps} onChange={(ev) => setReps(+ev.target.value)} /></label>
                  <label className="text-xs">Beban (kg)<input className={inputClass + ' mt-1 w-20'} type="number" value={weight} onChange={(ev) => setWeight(+ev.target.value)} /></label>
                  <Button onClick={() => logExercise(e.id)} className="h-9"><IconPlus size={14} /> Catat</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {todayLog.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconFlame size={18} />} title="Log Hari Ini" subtitle="Riwayat set yang sudah dicatat" />
          <div className="mt-2 space-y-1.5">
            {todayLog.map((l) => {
              const ex = EX.find((x) => x.id === l.exId)
              return (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm">
                  <span className="font-semibold">{ex?.name}</span>
                  <span className="text-xs text-neutral-400">{l.sets}×{l.reps} {l.weight > 0 ? `@ ${l.weight}kg` : ''}</span>
                  <IconCheck size={14} className="text-brand" />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={18} />} title="Prinsip Pemrograman" subtitle="Dasar sport science untuk menyusun progresi" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• <b>Progressive overload</b>: naikkan beban/reps/volume 2.5-10%/minggu selama RPE &lt;8-9.</li>
          <li>• <b>Periodisasi</b>: selingi fase volume tinggi-intensitas rendah dengan fase intensitas tinggi-volume rendah; deload tiap 4-6 minggu.</li>
          <li>• <b>Spesifisitas</b>: gerakan statis (plank, isometric hold) membangun stabilitas sendi & kontrol motorik; gerakan dinamis membangun kekuatan & power eksplosif.</li>
          <li>• <b>Pemulihan sendi/jaringan ikat</b>: beri 48-72 jam antar sesi kelompok otot yang sama untuk resintesis kolagen tendon & remodeling otot.</li>
          <li>• <b>HIIT/Battling Ropes/Muay Thai</b> sangat efektif untuk EPOC & fat loss namun bebani sistem saraf — batasi 2-3x/minggu, kombinasikan dengan hari mobility/recovery.</li>
          <li>• <b>Post natal</b>: mulai dari diaphragmatic breathing & pelvic floor activation, baru progres ke isometrik (plank ringan), lalu dinamis ringan setelah skrining diastasis recti oleh tenaga kesehatan.</li>
        </ul>
      </Card>
    </div>
  )
}

export default Workout
