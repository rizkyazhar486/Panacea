import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconRun } from '../components/icons'
import { ambilTersembunyi, saring, langgananFitur } from '../lib/fiturTersembunyi'

// ─────────────────────────────────────────────────────────────────────────────
// Fitness Hub — one searchable index for the training/performance suite,
// same pattern as Wellness Hub and Calculator Hub. Lets the Fitness sidebar
// group stay short (a few daily-use entries) without losing reachability for
// the rest. Pure catalog, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Tool { to: string; name: string; what: string; kw: string; tag: string }

export const GROUPS: { title: string; emoji: string; tools: Tool[] }[] = [
  {
    title: 'Daily Training',
    emoji: '🏃',
    tools: [
      { to: '/athlete', name: 'Athlete', what: 'Your training dashboard — HR zones, load, GPS runs', kw: 'athlete dashboard heart rate zones gps run', tag: 'Core' },
      { to: '/workout', name: 'Workout', what: 'Guided sessions with movement-form demo videos', kw: 'workout exercise session movement demo', tag: 'Core' },
      { to: '/training-plan', name: 'AI Program', what: 'A structured, adaptive training plan', kw: 'training plan program ai schedule periodization', tag: 'Core' },
      { to: '/lari-sepeda-renang', name: 'Lari, Sepeda, Renang', what: 'Power zones, swim CSS, speed work and posture across three sports', kw: 'lari sepeda renang cycling swimming triathlon ftp watt power zone css critical swim speed cadence bike fit kecepatan speed', tag: 'Core' },
      { to: '/teknik-lari', name: 'Teknik Lari', what: 'Irama langkah, jangkauan kaki, ayunan lengan, napas, start dan aerodinamis', kw: 'teknik lari running form cadence irama langkah spm stride panjang langkah overstriding postur posisi badan lean condong gerakan kaki foot strike pendaratan tumit midfoot forefoot lengan arm swing napas pernapasan breathing diafragma start pemanasan aerodinamis drafting angin endurance daya tahan volume intensitas 80/20', tag: 'Core' },
      { to: '/peregangan', name: 'Peregangan & Postur', what: 'Rutinitas per situasi — sebelum lari, sesudah sepeda, jeda kerja duduk', kw: 'peregangan stretching stretch dinamis statis yoga pilates postur posture mobilitas mobility pemanasan warm up pendinginan cooldown hamstring betis bahu pinggul leher fleksor lari renang sepeda', tag: 'Core' },
      { to: '/crossfit', name: 'CrossFit & AMRAP', what: 'Workout formats, named benchmarks, and how to scale them safely', kw: 'crossfit amrap emom wod tabata chipper couplet triplet ladder hyrox cindy mary angie barbara chelsea annie fran helen grace karen murph chad jt benchmark girls hero rabdomiolisis rhabdo skala scaling pemula', tag: 'Core' },
      { to: '/alat-fitness', name: 'Alat Fitness & Hyrox', what: 'Gym equipment guide and Hyrox-style workout formats', kw: 'alat fitness gym equipment hyrox mesin beban dumbbell barbell kettlebell', tag: 'Core' },
      { to: '/sports-lab', name: 'Sports Lab', what: 'Sport-specific testing and performance breakdowns', kw: 'sports lab tes olahraga performa cabang', tag: 'Core' },
      { to: '/health-data', name: 'Sambungkan Perangkat', what: 'Sinkronisasi Apple Watch, unggah ekspor Garmin/WHOOP/InBody', kw: 'connect sambungkan perangkat device wearable apple watch garmin whoop inbody sinkron sync impor import', tag: 'Core' },
      { to: '/analisis-gerak', name: 'Movement Analysis', what: 'Walking asymmetry, gait quality, running form and heart-rate recovery, read from your watch export', kw: 'gait berjalan asimetri asymmetry langkah step length double support cadence irama ground contact vertical oscillation running form bentuk lari hrr cardio recovery pemulihan stair speed tangga daylight cahaya headphone audio', tag: 'Core' },
      { to: '/riwayat-latihan', name: 'History Latihan', what: 'Every imported session with its per-minute heart-rate curve, zone split and recovery', kw: 'workout latihan riwayat history sesi heart rate curve kurva zona zone 80/20 easy pace hrr recovery pemulihan apple watch import notification peringatan denyut', tag: 'Core' },
      { to: '/log-detak-jantung', name: 'Heart Rate Log', what: 'Every heart-rate sample your watch pushes, with how dense the data really is', kw: 'heart rate log detak jantung real time realtime live monitor sampel webhook auto export apple watch bpm', tag: 'Core' },
      { to: '/pola-tidur', name: 'Sleep Pattern', what: 'Sleep by stage per night — deep, REM, core, awake — plus bedtime regularity', kw: 'tidur sleep pola stage deep rem core awake tahapan malam jam tidur keteraturan regularity apple watch jaga shift', tag: 'Core' },
      { to: '/analisis-pro', name: 'Analisis Pro', what: 'Kebugaran & kesegaran, upaya relatif, usaha terbaik, zona pace, log latihan dan target', kw: 'analisis pro strava fitness freshness ctl atl tsb kebugaran kesegaran relative effort upaya relatif training log best efforts usaha terbaik rekor pr goals target zona pace gap grade adjusted', tag: 'Core' },
      { to: '/body-battery', name: 'Body Battery', what: 'Cadangan energi 0-100 sepanjang hari dan tingkat stres, dari deret denyut', kw: 'body battery baterai energi cadangan stres stress sepanjang hari all day pemulihan recovery garmin hrv denyut istirahat', tag: 'Core' },
      { to: '/fisiologi-latihan', name: 'Training Physiology', what: 'Training load, status, recovery time, training effect, readiness and threshold — computed from your watch', kw: 'training load beban acute chronic acwr epoc trimp status recovery pemulihan readiness kesiapan training effect lthr ambang laktat performance condition endurance ketahanan garmin firstbeat suggested workout', tag: 'Core' },
      { to: '/alat-endurance', name: 'Alat Endurance', what: 'Fuelling plan, sweat rate, cycling FTP and zones, course power guide, heat and altitude acclimation', kw: 'fueling bahan bakar karbohidrat carb sweat rate keringat natrium sodium hidrasi ftp watt wkg power zone coggan power guide pacing tanjakan gradien acclimation aklimatisasi panas heat altitude ketinggian sepeda cycling', tag: 'Core' },
      { to: '/pelacak-klinis', name: 'Pelacak Klinis', what: 'SpO2 log, ECG result diary, jet lag plan, pregnancy activity, wheelchair physiology', kw: 'spo2 saturasi pulse ox oksigen ekg ecg afib fibrilasi atrium jet lag jetlag circadian kehamilan hamil pregnancy trimester kursi roda wheelchair paraplegi disrefleksia bahu shoulder', tag: 'Core' },
      { to: '/latihan-dasar', name: 'Foundation Training & Postur', what: 'Running pace zones, push/pull/sit-up progressions, posture correction', kw: 'lari run pace easy tempo interval long push up pull up sit up kalistenik calisthenics postur posture vdot', tag: 'Core' },
      { to: '/fitness-test', name: 'Fitness Test', what: 'AI form & posture check from a photo of your movement', kw: 'fitness test form posture ai photo injury risk', tag: 'AI' },
    ],
  },
  {
    title: 'Recovery & Readiness',
    emoji: '🔋',
    tools: [
      { to: '/readiness', name: 'Recovery & Strain', what: "Is today a push day or a rest day?", kw: 'recovery strain readiness hrv fatigue', tag: 'Recovery' },
      { to: '/assessment', name: 'Initial Assessment', what: 'Baseline fitness & movement screening', kw: 'initial assessment baseline screening onboarding', tag: 'Core' },
    ],
  },
  {
    title: 'Body & Performance Data',
    emoji: '📊',
    tools: [
      { to: '/body', name: 'Body Composition', what: 'InBody-style visual breakdown of your composition', kw: 'body composition inbody fat muscle scale', tag: 'Data' },
      { to: '/lab', name: 'Performance Lab', what: 'Load management, VO2max, and performance metrics', kw: 'performance lab vo2max load management', tag: 'Data' },
      { to: '/sports-science', name: 'Science & KPIs', what: 'The evidence and key metrics behind your numbers', kw: 'sports science kpi evidence metrics', tag: 'Data' },
      { to: '/organ-vitality', name: 'Anti-Aging & Organs', what: 'System-by-system vitality snapshot', kw: 'organ vitality anti-aging longevity', tag: 'Longevity' },
    ],
  },
  {
    title: 'Programs & Scores',
    emoji: '🏆',
    tools: [
      { to: '/shape-forming', name: 'Shape Forming', what: 'A structured body-recomposition program', kw: 'shape forming body recomposition program', tag: 'Program' },
      { to: '/sports-scores', name: 'Live Scores', what: 'Real-time scores for your favorite teams & leagues', kw: 'live scores sports scoreboard football f1 motogp', tag: 'Live' },
    ],
  },
]

export function FitnessHub() {
  const [query, setQuery] = useState('')
  // Fitur yang disembunyikan pengguna juga hilang dari hub, bukan hanya dari
  // menu — kalau tidak, "disembunyikan" hanya berarti pindah tempat.
  const [tersembunyi, setTersembunyi] = useState<string[]>(ambilTersembunyi)
  useEffect(() => langgananFitur(setTersembunyi), [])
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    const dasar = GROUPS.map((g) => ({ ...g, tools: saring(g.tools, tersembunyi) })).filter((g) => g.tools.length > 0)
    if (!q) return dasar
    return dasar.map((g) => ({
      ...g,
      tools: g.tools.filter((t) => (t.name + ' ' + t.what + ' ' + t.kw).toLowerCase().includes(q)),
    })).filter((g) => g.tools.length > 0)
  }, [q, tersembunyi])

  const total = GROUPS.reduce((s, g) => s + g.tools.length, 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Fitness Hub" subtitle={`${total} training & performance tools, searchable by what you need`} />
        <input
          className={`${inputClass} mt-3`}
          placeholder="Search: recovery, body composition, VO2max, plan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </Card>

      {filtered.length === 0 && (
        <Card className="!p-5 text-center text-sm text-neutral-400">
          Nothing matches "{query}" — try "recovery", "plan", or "data".
        </Card>
      )}

      {filtered.map((g) => (
        <Card key={g.title} className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{g.emoji} {g.title}</div>
          <div className="mt-3 space-y-1.5">
            {g.tools.map((t) => (
              <a key={t.to} href={`#${t.to}`} className="group flex items-start justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 transition hover:bg-brand/10 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink group-hover:text-brand-dark dark:text-white">{t.name}</div>
                  <div className="text-[12px] leading-snug text-neutral-500">{t.what}</div>
                </div>
                <span className="mt-1 shrink-0 text-neutral-300 transition group-hover:text-brand-dark">→</span>
              </a>
            ))}
          </div>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Training guidance here is educational, not a substitute for individualized coaching —
        especially if you have an existing injury or medical condition.
      </div>
    </div>
  )
}

export default FitnessHub
