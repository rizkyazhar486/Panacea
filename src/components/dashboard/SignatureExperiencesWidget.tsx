import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getWorkouts } from '../../lib/workoutStore'
import { IconActivity, IconBook, IconRun, IconSparkle } from '../icons'

type Experience = {
  to: string
  eyebrow: string
  title: string
  question: string
  detail: string
  cta: string
  icon: typeof IconActivity
  className: string
  accent: string
}

export function SignatureExperiencesWidget() {
  const workouts = useMemo(() => getWorkouts(), [])
  const replayReady = workouts.length > 0

  const experiences: Experience[] = [
    {
      to: '/body-explorer?mode=realistic-atlas',
      eyebrow: '3D BODY',
      title: 'Explore anatomy',
      question: 'Where is it?',
      detail: 'Rotate the body and reveal structures before opening deeper explanations.',
      cta: 'Open anatomy',
      icon: IconActivity,
      className: 'border-cyan-300/15 bg-[radial-gradient(circle_at_85%_0%,rgba(104,231,244,.18),transparent_42%),linear-gradient(145deg,#071721,#061019)]',
      accent: 'text-cyan-200',
    },
    {
      to: '/body-explorer?mode=workout-4d',
      eyebrow: 'MY MOVEMENT',
      title: 'Replay a workout',
      question: 'What happened while I moved?',
      detail: replayReady
        ? `${workouts.length} recorded workout${workouts.length === 1 ? '' : 's'} can be opened as a movement and physiology story.`
        : 'Log or connect a workout, then see movement and physiology together.',
      cta: replayReady ? 'Replay workout' : 'Start workout view',
      icon: IconRun,
      className: 'border-emerald-300/15 bg-[radial-gradient(circle_at_85%_0%,rgba(0,191,99,.22),transparent_42%),linear-gradient(145deg,#071a16,#061019)]',
      accent: 'text-emerald-300',
    },
    {
      to: '/body-explorer?mode=surgery',
      eyebrow: 'SURGERY',
      title: 'See the operation',
      question: 'How do the steps relate to anatomy?',
      detail: 'Follow approach, target anatomy and structures at risk as one visual sequence.',
      cta: 'Open surgery',
      icon: IconSparkle,
      className: 'border-amber-200/15 bg-[radial-gradient(circle_at_85%_0%,rgba(240,214,138,.18),transparent_42%),linear-gradient(145deg,#1a1309,#0d0d0b)]',
      accent: 'text-[#f0d68a]',
    },
    {
      to: '/body-explorer?mode=surgery-rehearsal',
      eyebrow: 'ACTIVE RECALL',
      title: 'Test yourself',
      question: 'Can I remember the sequence?',
      detail: 'Predict first, reveal second. Use the atlas to learn—not to imply surgical competence.',
      cta: 'Start rehearsal',
      icon: IconBook,
      className: 'border-orange-300/15 bg-[radial-gradient(circle_at_85%_0%,rgba(251,146,60,.17),transparent_42%),linear-gradient(145deg,#1a0e0a,#0c0b10)]',
      accent: 'text-orange-300',
    },
  ]

  return (
    <section className="liquid-panel overflow-hidden p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Explore visually</div>
          <h2 className="mt-1 text-xl font-black tracking-[-.025em] text-neutral-900 dark:text-white">Start with what you want to understand</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-neutral-500 dark:text-white/45">No engine names to learn first. Pick a question and PanaceaMed opens the right visual experience.</p>
        </div>
        <Link to="/body-explorer" className="rounded-full border border-black/[.06] bg-white/55 px-3 py-2 text-[10px] font-black text-neutral-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[.05] dark:text-white">All body tools →</Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {experiences.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative min-h-[210px] overflow-hidden rounded-[24px] border p-4 text-white shadow-[0_16px_42px_rgba(0,0,0,.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,.2)] ${item.className}`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/[.06]" />
              <div className="flex items-center justify-between gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.06] ${item.accent}`}><Icon size={18} /></span>
                <span className="text-[8px] font-black tracking-[.18em] text-white/35">{item.eyebrow}</span>
              </div>
              <div className={`mt-5 text-[10px] font-black uppercase tracking-[.14em] ${item.accent}`}>{item.question}</div>
              <div className="mt-1 text-lg font-black tracking-tight">{item.title}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/48">{item.detail}</p>
              <div className={`absolute bottom-4 left-4 text-[10px] font-black ${item.accent}`}>{item.cta} →</div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
