import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getWorkouts } from '../../lib/workoutStore'
import { IconActivity, IconBook, IconRun, IconSparkle } from '../icons'

export function SignatureExperiencesWidget() {
  const workouts = useMemo(() => getWorkouts(), [])
  const replayReady = workouts.length > 0

  return (
    <section className="liquid-panel overflow-hidden p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Signature experiences</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-neutral-900 dark:text-white">Things worth opening PanaceaMed for</h2>
        </div>
        <Link to="/body-explorer" className="text-xs font-black text-brand-dark dark:text-emerald-300">Open Human Biology Engine →</Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Link to="/body-explorer?mode=workout-4d" className="group relative overflow-hidden rounded-[24px] border border-emerald-500/15 bg-[radial-gradient(circle_at_80%_10%,rgba(0,191,99,.18),transparent_42%),linear-gradient(135deg,rgba(4,16,18,.98),rgba(5,29,20,.96))] p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,.12)]">
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-emerald-300"><IconRun size={18} /></span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wide text-white/45">4D · longitudinal</span>
          </div>
          <div className="mt-5 text-base font-black">Inside My Workout + Human Replay</div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/45">Replay a real session inside reference anatomy, compare Workout DNA, then scrub through months of your recorded movement history.</p>
          <div className="mt-4 text-[9px] font-black text-emerald-300">{replayReady ? `${workouts.length} workout${workouts.length === 1 ? '' : 's'} ready to replay →` : 'Connect your first workout →'}</div>
        </Link>

        <Link to="/body-explorer?mode=surgery" className="group relative overflow-hidden rounded-[24px] border border-amber-400/15 bg-[radial-gradient(circle_at_80%_10%,rgba(240,214,138,.17),transparent_42%),linear-gradient(135deg,rgba(15,11,9,.98),rgba(28,18,9,.96))] p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,.12)]">
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-[#f0d68a]"><IconSparkle size={18} /></span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wide text-white/45">Operation Universe</span>
          </div>
          <div className="mt-5 text-base font-black">Explore surgery as spatial anatomy</div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/45">Step through operations as approach → anatomy → target → structures at risk → final anatomy, all inside one reusable 4D engine.</p>
          <div className="mt-4 text-[9px] font-black text-[#f0d68a]">Enter Operation Universe →</div>
        </Link>

        <Link to="/body-explorer?mode=surgery-rehearsal" className="group relative overflow-hidden rounded-[24px] border border-orange-400/15 bg-[radial-gradient(circle_at_80%_10%,rgba(251,146,60,.16),transparent_42%),linear-gradient(135deg,rgba(13,10,16,.98),rgba(30,14,10,.96))] p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,.12)]">
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-orange-300"><IconBook size={18} /></span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wide text-white/45">Active recall</span>
          </div>
          <div className="mt-5 text-base font-black">Rehearse before revealing</div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/45">Predict the anatomy risk map, reveal the checkpoint, compare operations side by side, and track atlas coverage without pretending it equals surgical competence.</p>
          <div className="mt-4 flex items-center gap-1 text-[9px] font-black text-orange-300"><IconActivity size={12} /> Start rehearsal →</div>
        </Link>
      </div>
    </section>
  )
}
