import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconMoon } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Chronotype Quiz — the reduced Morningness-Eveningness Questionnaire (rMEQ),
// Adan & Almirall (1991), Personality and Individual Differences, a widely
// validated 5-item short form of Horne & Östberg's original 1976 MEQ. Pure
// arithmetic scoring, no external API. Total score 4-25, five categories:
// Definite Evening (4-7), Moderate Evening (8-11), Intermediate (12-17),
// Moderate Morning (18-21), Definite Morning (22-25).
// ─────────────────────────────────────────────────────────────────────────────

interface Option { label: string; points: number }
interface Question { text: string; options: Option[] }

const QUESTIONS: Question[] = [
  {
    text: 'Considering only your own "feeling best" rhythm, at what time would you get up if you were entirely free to plan your day?',
    options: [
      { label: '05:00 - 06:30', points: 5 },
      { label: '06:31 - 07:45', points: 4 },
      { label: '07:46 - 09:45', points: 3 },
      { label: '09:46 - 11:00', points: 2 },
      { label: '11:01 - 12:00', points: 1 },
    ],
  },
  {
    text: 'At what time would you go to bed if entirely free to plan your evening?',
    options: [
      { label: '20:00 - 21:00', points: 5 },
      { label: '21:01 - 22:15', points: 4 },
      { label: '22:16 - 00:30', points: 3 },
      { label: '00:31 - 01:45', points: 2 },
      { label: '01:46 - 03:00', points: 1 },
    ],
  },
  {
    text: 'If you have to get up at a specific time in the morning, how dependent are you on being woken up by an alarm clock?',
    options: [
      { label: 'Not at all dependent', points: 4 },
      { label: 'Slightly dependent', points: 3 },
      { label: 'Fairly dependent', points: 2 },
      { label: 'Very dependent', points: 1 },
    ],
  },
  {
    text: 'How easy do you find getting up in the morning (when not awakened unexpectedly)?',
    options: [
      { label: 'Not at all easy', points: 1 },
      { label: 'Slightly easy', points: 2 },
      { label: 'Fairly easy', points: 3 },
      { label: 'Very easy', points: 4 },
    ],
  },
  {
    text: 'How alert do you feel during the first half hour after having awakened in the morning?',
    options: [
      { label: 'Not at all alert', points: 1 },
      { label: 'Slightly alert', points: 2 },
      { label: 'Fairly alert', points: 3 },
      { label: 'Very alert', points: 4 },
    ],
  },
]

function bandFor(score: number): { label: string; desc: string; tone: 'brand' | 'low' | 'neutral' | 'critical' } {
  if (score <= 7) return { label: 'Definite Evening Type', tone: 'critical', desc: 'Strong "night owl" pattern — you likely feel sharpest late afternoon/evening and struggle most with early mornings.' }
  if (score <= 11) return { label: 'Moderate Evening Type', tone: 'low', desc: 'Leans toward evening — a later, but not extreme, natural rhythm.' }
  if (score <= 17) return { label: 'Intermediate Type', tone: 'neutral', desc: 'No strong morning or evening preference — the most common category in the general population.' }
  if (score <= 21) return { label: 'Moderate Morning Type', tone: 'brand', desc: 'Leans toward morning — you likely feel sharpest earlier in the day.' }
  return { label: 'Definite Morning Type', tone: 'brand', desc: 'Strong "early bird" pattern — peak alertness early, and evenings wind down sooner.' }
}

export function Chronotype() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null))
  const answered = answers.every((a) => a !== null)
  const score = answered ? (answers as number[]).reduce((s, a) => s + a, 0) : null
  const band = score != null ? bandFor(score) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Chronotype Quiz" subtitle="Reduced Morningness-Eveningness Questionnaire (rMEQ)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          A validated 5-item short form (Adan &amp; Almirall, 1991) of the classic Horne &amp; Östberg
          questionnaire, used in chronobiology research to classify a person's natural circadian
          preference. Answer based on how you'd naturally feel — not your current schedule.
        </p>
      </Card>

      {QUESTIONS.map((q, qi) => (
        <Card key={qi} className="!p-5">
          <div className="text-sm font-bold text-ink dark:text-white">{qi + 1}. {q.text}</div>
          <div className="mt-3 flex flex-col gap-2">
            {q.options.map((o) => (
              <button
                key={o.label}
                onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? o.points : v)))}
                className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                  answers[qi] === o.points
                    ? 'border-brand bg-brand-50 text-brand-dark'
                    : 'border-neutral-200 text-neutral-600 hover:border-brand/30 dark:border-white/10 dark:text-neutral-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Card>
      ))}

      {band && score != null && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your result</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-black text-brand-dark">{score}</span>
            <div>
              <Badge tone={band.tone}>{band.label}</Badge>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{band.desc}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            Chronotype is a real, measurable trait linked to differences in core body temperature rhythm
            and melatonin timing — it's not just a habit. It can inform when to schedule demanding tasks,
            exercise, and — for a clinician — the timing of some medications (chronotherapy) and sleep
            hygiene advice. It's a trait tendency, not a fixed diagnosis, and can shift somewhat with age
            (adolescents skew later; older adults skew earlier).
          </p>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Adan, A., &amp; Almirall, H. (1991). Horne &amp; Östberg morningness-eveningness questionnaire: A
        reduced scale. <i>Personality and Individual Differences</i>, 12(3), 241-253. Educational
        self-assessment, not a clinical sleep disorder diagnosis.
      </div>
    </div>
  )
}

export default Chronotype
