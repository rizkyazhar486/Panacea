import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity, IconRun, IconHeart, IconChartUp } from '../components/icons'
import { useStore } from '../lib/store'

// ── Key Performance Indicators per cabang, dari sains olahraga nyata ──────────
// Tiap KPI menjelaskan: apa yang diukur, alat/indikator (jam/device/tes), dan
// kenapa penting untuk performa & pencegahan cedera.
const KPI_LIBRARY: { group: string; emoji: string; kpis: { name: string; how: string; why: string }[] }[] = [
  {
    group: 'Endurance (Running, Cycling, Swimming, Triathlon)',
    emoji: '🏃',
    kpis: [
      { name: 'VO₂max', how: 'Watch estimate from HR + pace, or lab test', why: 'The ceiling of aerobic capacity — the best predictor of endurance performance.' },
      { name: 'Lactate Threshold (LT)', how: '30-minute field test / watch HR-pace analysis', why: 'The highest intensity that can be sustained; training right at LT raises the threshold.' },
      { name: 'Running Economy / Efficiency', how: 'Watts or pace per HR at a fixed load', why: 'How efficiently oxygen is used — the differentiator among elites at equal VO₂max.' },
      { name: 'Acute:Chronic Workload (ACWR)', how: '7-day load ÷ 28-day average', why: 'A key injury-risk marker; sweet spot 0.8–1.3.' },
      { name: 'HRV', how: 'Nightly measurement from a watch (rMSSD)', why: 'Autonomic nervous system recovery status — when it is safe to push.' },
    ],
  },
  {
    group: 'Team/Field Sports (Soccer, Basketball, Rugby, Futsal)',
    emoji: '⚽',
    kpis: [
      { name: 'High-Speed Running & Sprint Distance', how: 'GPS vest (e.g., Catapult/STATSports)', why: 'External load — the dose of high-speed running determines readiness & hamstring risk.' },
      { name: 'Accelerations / Decelerations', how: 'GPS accelerometer', why: 'High mechanical load; a driver of muscle fatigue & injury.' },
      { name: 'PlayerLoad / Total Load', how: 'GPS + triaxial accelerometer', why: 'Total session load for weekly periodization.' },
      { name: 'Countermovement Jump (CMJ)', how: 'Force plate / jump mat', why: 'Monitors neuromuscular fatigue — a drop >10% means not yet recovered.' },
      { name: 'Heart Rate Recovery (HRR)', how: '60-second HR drop post-exercise', why: 'An index of fitness & cardiovascular readiness.' },
    ],
  },
  {
    group: 'Strength & Power (Weightlifting, Sprinting, Combat Sports)',
    emoji: '🏋️',
    kpis: [
      { name: 'Estimated 1RM & Velocity (VBT)', how: 'Velocity-based training encoder', why: 'Measures daily strength output; adjust load to match readiness.' },
      { name: 'Rate of Force Development', how: 'Force plate', why: 'How quickly force is produced — key for explosive power.' },
      { name: 'Session RPE (sRPE)', how: 'Duration × RPE (1–10), Foster method', why: 'A simple internal load metric without expensive equipment; the basis of ACWR.' },
      { name: 'Sleep & Recovery Score', how: 'Watch/ring (Whoop, Oura, Garmin)', why: 'Recovery & hormonal adaptation occur during sleep.' },
    ],
  },
  {
    group: 'Precision & Mental (Tennis, Golf, Esports, Shooting)',
    emoji: '🎾',
    kpis: [
      { name: 'Reaction Time & Consistency', how: 'Cognitive test / app', why: 'The differentiator in high-precision critical moments.' },
      { name: 'Stress / Body Battery', how: 'All-day HRV from a watch', why: 'Managing mental load & energy heading into competition.' },
      { name: 'Mindfulness / Mental RPE', how: 'Daily journal + 1–10 scale', why: 'Real psychological load affects performance & recovery.' },
    ],
  },
]

// ── Metode tim juara dunia (referensi nyata sains olahraga) ──────────────────
const WINNING_TEAMS: { team: string; emoji: string; principle: string; method: string }[] = [
  { team: 'Real Madrid', emoji: '👑', principle: 'Individualization & load management', method: 'Tactical periodization + individual GPS monitoring; rotation & load management keep players peaking in critical phases (Champions League).' },
  { team: 'Mercedes-AMG F1', emoji: '🏎️', principle: 'Marginal gains & data', method: 'A "marginal gains" culture: hundreds of data points + simulations; 0.1% improvements across many areas compound into a winning edge.' },
  { team: 'FC Barcelona', emoji: '🔵', principle: 'Tactical periodization (Seirul·lo)', method: 'Integrated technical-tactical-physical training; load is conditioned within game context, not trained in isolation.' },
  { team: 'Manchester City', emoji: '🩵', principle: 'Holistic sport science', method: 'A large science team: GPS, CMJ, HRV, sleep & nutrition monitored daily to individualize Guardiola\'s load management.' },
  { team: 'LA Lakers', emoji: '🏀', principle: 'Load management & longevity', method: 'Scheduled minute restrictions & rest (load management) extend star careers & preserve peak form for the playoffs.' },
  { team: 'Team Roger Federer', emoji: '🎾', principle: 'Scheduling & efficiency', method: 'Selective calendar: choosing tournaments, periodized recovery, and movement efficiency sustain performance across decades.' },
  { team: 'New England Patriots', emoji: '🏈', principle: 'Process & attention to detail', method: 'A "do your job" culture: strict training standards, accountability, & measured preparation each phase of the season.' },
  { team: 'Green Bay Packers', emoji: '🧀', principle: 'Science-based reconditioning', method: 'Reconditioning programs & readiness monitoring to reduce soft-tissue injuries throughout the season.' },
  { team: 'PSG', emoji: '🔴', principle: 'Elite load monitoring', method: 'Integrating medical-performance data for rotation & injury prevention on a packed schedule.' },
  { team: 'Team Falcons (Esports)', emoji: '🎮', principle: 'Cognitive performance & recovery', method: 'Sleep management, HRV & cognitive breaks to maintain focus and reaction time across long tournaments.' },
  { team: 'Seattle Seahawks', emoji: '💚', principle: 'Mentality & mindfulness', method: 'A mindfulness/psychology program (Pete Carroll & Michael Gervais): emotional regulation & focus as performance KPIs.' },
]

// ── Referensi jurnal & buku ──────────────────────────────────────────────────
const REFERENCES = [
  'Gabbett TJ. The training—injury prevention paradox. Br J Sports Med 2016.',
  'Foster C. Monitoring training in athletes (session RPE). Med Sci Sports Exerc 1998.',
  'Bompa & Buzzichelli. Periodization: Theory and Methodology of Training.',
  'Seiler S. Polarized training intensity distribution. Int J Sports Physiol Perform.',
  'Plews & Laursen. Heart Rate Variability in elite endurance athletes.',
  'Buchheit M. The 30-15 Intermittent Fitness Test & HR monitoring.',
  'Jones AM. The physiology of the world-record marathon (running economy).',
  "Gallwey WT. The Inner Game of Tennis: Self 1/Self 2 & Performance = Potential − Interference (basis of the sport psychology above).",
  'Mujika I, Padilla S. Scientific bases for precompetition tapering strategies. Med Sci Sports Exerc 2003.',
  'Fullagar HHK, et al. Sleep and athletic performance: effects of sleep loss on performance & recovery. Sports Med 2015.',
]

// ── Tujuh cabang ilmu keolahragaan (exercise science) ────────────────────────
// Tiap cabang dijelaskan + bagaimana ia membentuk rencana latihan pengguna.
const SCIENCE_BRANCHES: { name: string; emoji: string; what: string; apply: string }[] = [
  { name: 'Biomechanics', emoji: '📐', what: 'Analysis of force, motion, leverage & body technique.', apply: 'Refine technique (running posture, squat angle) for efficiency & to prevent overuse injuries.' },
  { name: 'Anatomy', emoji: '🦴', what: 'Structure of muscles, joints, bones & tissue.', apply: 'Choose exercises that target the correct muscle chain & protect vulnerable joints.' },
  { name: 'Physiology', emoji: '🫀', what: 'Energy system, cardiovascular & muscular responses to load.', apply: 'Set HR zones, VO₂max & lactate threshold so adaptation is properly targeted.' },
  { name: 'Psychomotor Behavior', emoji: '🎯', what: 'The cognition–movement relationship: accuracy, reaction time, coordination.', apply: 'Train specific skills (precision drills) under competition-like conditions.' },
  { name: 'Neuroscience', emoji: '🧠', what: 'The role of the brain & nervous system in adaptation and fatigue.', apply: 'Manage neural load (HRV) & schedule recovery so the nervous system can recover.' },
  { name: 'Motor Control', emoji: '🕹️', what: 'How movements are learned & automated.', apply: 'Progress from conscious → automatic through structured repetition & variation.' },
  { name: 'Sport Psychology', emoji: '💭', what: 'Motivation, focus, emotional regulation & champion mentality — including Timothy Gallwey\'s "Inner Game" framework: Self 1 (the judgmental, overthinking conscious mind) vs Self 2 (the body\'s natural ability); Performance = Potential − Interference.', apply: 'Reduce "interference" (self-doubt, overthinking technique) through non-judgmental focus on process (not outcome), pre-competition routines & mindfulness, so Self 2 can work without Self 1\'s interference.' },
]

// ── Prinsip latihan (7 prinsip ilmu olahraga) ────────────────────────────────
const TRAINING_PRINCIPLES: { name: string; emoji: string; rule: string; apply: string }[] = [
  { name: 'Overload', emoji: '⬆️', rule: 'Apply load above habitual levels so the body adapts.', apply: 'Increase volume/intensity in a measured way — but keep ACWR ≤1.3.' },
  { name: 'Progression', emoji: '📈', rule: 'Increase load gradually & systematically.', apply: 'The +10%/week rule; add one variable (distance OR intensity), not all at once.' },
  { name: 'Periodization', emoji: '🗓️', rule: 'Structure load–recovery cycles toward a peak.', apply: '3–4 week mesocycle blocks + deload; taper ahead of competition.' },
  { name: 'Specificity', emoji: '🎯', rule: 'Adaptation is specific to the type of load trained.', apply: 'Train according to your sport\'s demands (energy system, movement, speed).' },
  { name: 'Individualization', emoji: '🧬', rule: 'Adjust for age, level, genetics & response.', apply: 'Use personal data (VO₂max, HRV, RPE) rather than general averages.' },
  { name: 'Reversibility', emoji: '⬇️', rule: '"Use it or lose it" — fitness declines when training stops.', apply: 'Maintain a minimum load when busy/injured to avoid detraining.' },
  { name: 'Recovery / Adaptation', emoji: '😴', rule: 'Adaptation happens during recovery, not during training.', apply: 'Sleep 7–9 hours, insert easy days; monitor HRV & Recovery Time.' },
]

const SPORT_FILTERS = ['Semua', 'Lari', 'Sepeda', 'Renang', 'Gym', 'HIIT', 'Bola', 'Lainnya'] as const
const SPORT_FILTER_LABELS: Record<typeof SPORT_FILTERS[number], string> = {
  Semua: 'All', Lari: 'Running', Sepeda: 'Cycling', Renang: 'Swimming', Gym: 'Gym', HIIT: 'HIIT', Bola: 'Ball Sports', Lainnya: 'Other',
}

const ID_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const ID_DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function rpeColor(rpe: number) {
  if (rpe >= 8) return 'bg-red-500'
  if (rpe >= 6) return 'bg-amber-500'
  if (rpe >= 4) return 'bg-brand'
  return 'bg-emerald-300'
}

export function SportsScience() {
  const { state } = useStore()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [sport, setSport] = useState<typeof SPORT_FILTERS[number]>('Semua')

  // Index activities (training logs + GPS) by yyyy-mm-dd for the calendar.
  const byDate = useMemo(() => {
    const map: Record<string, { rpe?: number; type: string; emoji: string }[]> = {}
    const matches = (t: string) => sport === 'Semua' || t.toLowerCase().includes(sport.toLowerCase()) || (sport === 'Lainnya' && !['lari', 'sepeda', 'renang', 'gym', 'hiit', 'bola'].some((s) => t.toLowerCase().includes(s)))
    for (const l of state.trainingLogs ?? []) {
      if (!matches(l.type)) continue
      ;(map[l.date] ??= []).push({ rpe: l.rpe, type: l.type, emoji: '🔥' })
    }
    for (const g of state.gpsActivities ?? []) {
      const date = (g.at || '').slice(0, 10)
      if (!date || !matches(g.sport)) continue
      ;(map[date] ??= []).push({ type: g.sport, emoji: g.emoji || '📍' })
    }
    return map
  }, [state.trainingLogs, state.gpsActivities, sport])

  // Build the month grid (Mon-first).
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1)
    const startDow = (first.getDay() + 6) % 7 // Mon=0
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate()
    const out: (string | null)[] = []
    for (let i = 0; i < startDow; i++) out.push(null)
    for (let d = 1; d <= days; d++) out.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    return out
  }, [cursor])

  const monthCount = cells.filter((c) => c && byDate[c]).length
  function shift(delta: number) {
    setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Sports Science & KPIs" subtitle="Performance indicators, analysis & mentality — based on journals and world-champion team methods" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Physical preparation, workload, and precise timing ensure you reach peak fitness during
          critical phases. Data-based training — VO₂max, oxygen & CO₂ levels, lactate threshold, HRV — determines
          <b> what to push, what to protect, and how to manage injury recovery.</b>
        </p>
      </Card>

      {/* Activity Profile calendar */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Activity Profile" subtitle="Training calendar by sport" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SPORT_FILTERS.map((s) => (
            <button key={s} onClick={() => setSport(s)}
              className={'rounded-full px-3 py-1 text-[11px] font-bold transition ' + (sport === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
              {SPORT_FILTER_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:scale-90">‹</button>
          <div className="text-sm font-extrabold">{ID_MONTHS[cursor.m]} {cursor.y} <span className="ml-1 text-[11px] font-medium text-neutral-400">· {monthCount} active days</span></div>
          <button onClick={() => shift(1)} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:scale-90">›</button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-400">
          {ID_DOW.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />
            const items = byDate[c]
            const day = Number(c.slice(8))
            const top = items?.reduce((mx, it) => Math.max(mx, it.rpe ?? 0), 0) ?? 0
            return (
              <div key={i} className={'relative aspect-square rounded-lg border p-1 text-[10px] ' + (items ? 'border-brand/30 bg-brand-50' : 'border-neutral-100')} title={items?.map((it) => `${it.emoji} ${it.type}${it.rpe ? ` (RPE ${it.rpe})` : ''}`).join(', ')}>
                <span className="text-neutral-400">{day}</span>
                {items && (
                  <div className="absolute inset-x-1 bottom-1 flex items-center gap-0.5">
                    {top > 0 && <span className={'h-1.5 w-1.5 rounded-full ' + rpeColor(top)} />}
                    <span className="truncate text-[9px] leading-none">{items[0].emoji}{items.length > 1 ? `+${items.length - 1}` : ''}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-neutral-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-300" />Light</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand" />Moderate</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Hard</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Maximal (RPE 8+)</span>
        </div>
        {monthCount === 0 && <p className="mt-3 text-center text-xs text-neutral-400">No activity this month yet. Log it in Log & Statistics or record a GPS activity.</p>}
      </Card>

      {/* KPI library */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Key Indicators by Sport" subtitle="What is measured · tool/indicator · why it matters" />
        <div className="mt-3 space-y-4">
          {KPI_LIBRARY.map((grp) => (
            <div key={grp.group}>
              <div className="text-sm font-extrabold text-ink">{grp.emoji} {grp.group}</div>
              <div className="mt-2 space-y-2">
                {grp.kpis.map((k) => (
                  <div key={k.name} className="rounded-xl border border-neutral-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-brand-dark">{k.name}</span>
                      <Badge tone="neutral">{k.how}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{k.why}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Seven branches of exercise science */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Seven Branches of Sports Science" subtitle="The scientific foundation that shapes your training plan" />
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Science-based training planning applies scientific methods from seven branches to understand &
          improve performance, sport, and physical activity.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SCIENCE_BRANCHES.map((b) => (
            <div key={b.name} className="rounded-xl border border-neutral-100 p-3">
              <div className="text-sm font-extrabold">{b.emoji} {b.name}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{b.what}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-brand-dark"><b>Application:</b> {b.apply}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Training principles */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Training Principles (7 Principles)" subtitle="Core guidelines for designing an effective program" />
        <div className="mt-3 space-y-2">
          {TRAINING_PRINCIPLES.map((pr, i) => (
            <div key={pr.name} className="flex gap-3 rounded-xl border border-neutral-100 p-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-dark">{i + 1}</div>
              <div>
                <div className="text-sm font-extrabold">{pr.emoji} {pr.name}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{pr.rule}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-brand-dark"><b>Apply:</b> {pr.apply}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Periodization & peaking */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Periodization & Peaking" subtitle="Structuring load so peak fitness lands at the critical moment" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• <b>Macrocycle:</b> a seasonal plan toward a target (main competition).</li>
          <li>• <b>Mesocycle (3–4 weeks):</b> a progressive load block followed by 1 deload week (~–40% volume).</li>
          <li>• <b>Microcycle (1 week):</b> hard/easy distribution; keep ACWR at 0.8–1.3.</li>
          <li>• <b>Tapering:</b> 7–14 days before competition, reduce volume 40–60% while maintaining intensity — supercompensation → peak performance.</li>
          <li>• <b>Polarized distribution (80/20):</b> 80% easy training (Z1–Z2), 20% hard (Z4–Z5) — the pattern of elite endurance athletes.</li>
        </ul>
      </Card>

      {/* Injury management */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Load Management & Injury Recovery" subtitle="What to push, what to protect" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• <b>Protect</b> when ACWR &gt;1.5, HRV drops &gt;15% from baseline, or CMJ drops &gt;10% — reduce load.</li>
          <li>• <b>Push</b> when status is "Productive/Maintaining", HRV is balanced, sleep &ge;75 — add measured stimulus.</li>
          <li>• <b>Gradual return-to-play:</b> increase load by at most +10%/week after injury; pain &le;3/10 during & after.</li>
          <li>• <b>7–9 hours of sleep</b> is the primary recovery tool; sleep deficit measurably raises injury risk.</li>
        </ul>
      </Card>

      {/* References */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="World Champion Team Methods" subtitle="Real principles you can adopt" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {WINNING_TEAMS.map((t) => (
            <div key={t.team} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{t.emoji}</span>
                <span className="text-sm font-extrabold">{t.team}</span>
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-brand-dark">{t.principle}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{t.method}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-neutral-50 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Journal & Book References</div>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-neutral-500">
            {REFERENCES.map((r) => <li key={r}>• {r}</li>)}
          </ul>
          <p className="mt-2 text-[10px] text-neutral-400">Device indicator source: Garmin fēnix 7 — Performance Measurements, Training Status & Recovery (official Garmin manual). The citations above are landmark references underlying the concepts on this page — verify details (volume, edition year, DOI) directly on PubMed/publisher sites for formal academic purposes.</p>
        </div>
      </Card>
    </div>
  )
}
