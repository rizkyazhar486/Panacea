import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconMoon } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Epworth Sleepiness Scale (ESS) — Johns, M.W. (1991), Sleep, 14(6):540-545.
// One of the most widely used validated measures of excessive daytime
// sleepiness (as distinct from tiredness/fatigue). 8 situations, each rated
// 0-3 (chance of dozing), total 0-24. Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const SCALE = ['Would never doze', 'Slight chance of dozing', 'Moderate chance of dozing', 'High chance of dozing']

const SITUATIONS = [
  'Sitting and reading',
  'Watching TV',
  'Sitting inactive in a public place (e.g. a theatre or meeting)',
  'As a passenger in a car for an hour without a break',
  'Lying down to rest in the afternoon when circumstances permit',
  'Sitting and talking to someone',
  'Sitting quietly after lunch, without alcohol',
  'In a car, while stopped for a few minutes in traffic',
]

function bandFor(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; desc: string } {
  if (score <= 9) return { label: 'Normal range', tone: 'brand', desc: 'Not indicative of excessive daytime sleepiness.' }
  if (score <= 12) return { label: 'Mild excessive sleepiness', tone: 'low', desc: 'Worth discussing with a clinician, especially alongside snoring, poor sleep quality, or other symptoms.' }
  if (score <= 15) return { label: 'Moderate excessive sleepiness', tone: 'critical', desc: 'Meaningful daytime sleepiness — consider clinical evaluation for sleep disorders (e.g. sleep apnea, insufficient sleep, narcolepsy).' }
  return { label: 'Severe excessive sleepiness', tone: 'critical', desc: 'Significant impact on daily functioning and possibly driving safety — clinical evaluation is recommended.' }
}

export function EpworthSleepiness() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(SITUATIONS.length).fill(null))
  const answered = answers.every((a) => a !== null)
  const score = answered ? (answers as number[]).reduce((s, a) => s + a, 0) : null
  const band = score != null ? bandFor(score) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Epworth Sleepiness Scale" subtitle="Validated measure of excessive daytime sleepiness (Johns, 1991)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          How likely are you to doze off or fall asleep in each situation below — not just feeling
          tired, but actually dozing? Rate based on your usual way of life in recent times, even if you
          haven't done some of these things recently.
        </p>
      </Card>

      {SITUATIONS.map((text, qi) => (
        <Card key={qi} className="!p-5">
          <div className="text-sm font-bold text-ink dark:text-white">{qi + 1}. {text}</div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {SCALE.map((label, pts) => (
              <button
                key={label}
                onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? pts : v)))}
                className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold leading-tight transition ${
                  answers[qi] === pts
                    ? 'border-brand bg-brand-50 text-brand-dark'
                    : 'border-neutral-200 text-neutral-500 hover:border-brand/30 dark:border-white/10 dark:text-neutral-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      ))}

      {band && score != null && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your result</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-black text-brand-dark">{score}/24</span>
            <div>
              <Badge tone={band.tone}>{band.label}</Badge>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{band.desc}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Johns, M.W. (1991). A new method for measuring daytime sleepiness: the Epworth Sleepiness Scale.
        <i> Sleep</i>, 14(6), 540-545. Screening tool only, not a diagnosis — pairs well with the
        Chronotype Quiz and Sleep Apnea Screening in this app.
      </div>
    </div>
  )
}

export default EpworthSleepiness
