import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'
import { useVitals } from '../lib/useVitals'
import { vitalsAge } from '../lib/healthVitals'
import {
  DOMAIN_LABEL, pickDoses, triageBadReading,
  type Domain, type Slot,
} from '../lib/minimumDose'

// ─────────────────────────────────────────────────────────────────────────────
// "Sehat Tapi Sibuk" — built as a deliberate answer to the complaint that
// wearables hand out bad scores and no solutions.
//
// Three rules the page holds to:
//   1. Never open with a score. The first thing on screen is an action.
//   2. Every action must fit the time and energy the user actually says they
//      have — no plan is offered that assumes an hour they do not have.
//   3. A bad reading is reframed as information about today's plan, never as a
//      verdict on the person.
// ─────────────────────────────────────────────────────────────────────────────

const SLOTS: { v: Slot; l: string; sub: string }[] = [
  { v: 2, l: '2 minutes', sub: 'No time at all right now' },
  { v: 10, l: '10 minutes', sub: 'A gap between tasks' },
  { v: 30, l: '30 minutes', sub: 'Today is a bit freer' },
]

export function RealisticHealth() {
  const vitals = useVitals()
  const [slot, setSlot] = useState<Slot>(2)
  const [wrecked, setWrecked] = useState(false)
  const [worst, setWorst] = useState<Domain | null>(null)
  const [doneIds, setDoneIds] = useState<string[]>([])

  const doses = useMemo(() => pickDoses({ slot, wrecked, worst }), [slot, wrecked, worst])
  const primary = doses[0]
  const alternatives = doses.slice(1, 4)

  const triage = useMemo(
    () => triageBadReading({ sleepH: vitals.sleepH, restingHr: vitals.restingHr }),
    [vitals.sleepH, vitals.restingHr],
  )

  const toggleDone = (id: string) =>
    setDoneIds((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🌱</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Healthy But Busy</h1>
          <p className="text-xs text-neutral-500">One action that fits your day — not a score that makes you feel like a failure</p>
        </div>
      </div>

      <Card className="!p-4">
        <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          This page exists because of a fair complaint: many health apps tell you your recovery is
          poor and then stop there. Being marked badly with no way out makes nobody healthier — it
          only makes people stop opening the app. So here it is <b>action first, numbers second</b>,
          and no suggestion assumes time you do not have.
        </p>
      </Card>

      {/* Step 1 — the only inputs, kept to three taps. */}
      <Card className="!p-4">
        <SectionTitle icon={<IconHeart size={18} />} title="How much time do you realistically have?" subtitle="Answer honestly — a small answer is the useful one" />

        <div className="mt-3 grid gap-2">
          {SLOTS.map((s) => (
            <button
              key={s.v}
              onClick={() => setSlot(s.v)}
              className={`rounded-xl px-3 py-2.5 text-left transition ${
                slot === s.v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-200'
              }`}
            >
              <div className="text-[13px] font-bold">{s.l}</div>
              <div className={`text-[11px] ${slot === s.v ? 'text-ink/80' : 'text-neutral-500'}`}>{s.sub}</div>
            </button>
          ))}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
          <input type="checkbox" checked={wrecked} onChange={(e) => setWrecked(e.target.checked)} />
          <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
            I am genuinely out of energy today
          </span>
        </label>
        {wrecked && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
            Fine — suggestions that demand energy are hidden. On a day like this, keeping the habit
            alive is worth more than forcing a session.
          </p>
        )}

        <div className="mt-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">What is bothering you most right now</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => setWorst(null)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!worst ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
            >
              Not sure
            </button>
            {(Object.keys(DOMAIN_LABEL) as Domain[]).map((d) => (
              <button
                key={d}
                onClick={() => setWorst(worst === d ? null : d)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${worst === d ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
              >
                {DOMAIN_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Step 2 — ONE action. This is the point of the page. */}
      {primary && (
        <Card className="!p-5">
          <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Just do this today</div>
          <h2 className="mt-1 text-[17px] font-black leading-snug text-ink dark:text-ink">{primary.title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{primary.how}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">{primary.why}</p>
          <button
            onClick={() => toggleDone(primary.id)}
            className={`mt-3 w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
              doneIds.includes(primary.id) ? 'bg-brand-50 text-brand-dark' : 'bg-brand text-white hover:opacity-90'
            }`}
          >
            {doneIds.includes(primary.id) ? 'Done ✓' : 'Mark as done'}
          </button>
          {doneIds.includes(primary.id) && (
            <p className="mt-2 text-center text-[11px] leading-relaxed text-neutral-500">
              That is enough for today. There is no daily target to chase on this page.
            </p>
          )}
        </Card>
      )}

      {alternatives.length > 0 && (
        <Card className="!p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">If that one does not fit</div>
          <div className="mt-2 space-y-2">
            {alternatives.map((d) => (
              <div key={d.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-bold text-ink dark:text-ink">{d.title}</div>
                  <Badge tone="low">{d.minutes} mnt</Badge>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{d.how}</p>
                <button
                  onClick={() => toggleDone(d.id)}
                  className="mt-2 text-[11px] font-bold text-brand-dark hover:underline"
                >
                  {doneIds.includes(d.id) ? 'Done ✓' : 'Mark done'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3 — reframe a bad wearable reading, only if there IS one. */}
      {triage && (
        <Card className="!p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">
            Soal angka Anda {vitalsAge(vitals) ? `· ${vitalsAge(vitals)}` : ''}
          </div>
          <h3 className="mt-1 text-[14px] font-black text-ink dark:text-ink">{triage.headline}</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{triage.meaning}</p>
          <div className="mt-3 rounded-xl bg-brand-50 p-3 dark:bg-brand/10">
            <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">What is useful today</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{triage.doToday}</p>
          </div>
          {triage.seeDoctor && (
            <div className="mt-2 rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
              <div className="text-[11px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-300">Get checked if</div>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{triage.seeDoctor}</p>
            </div>
          )}
        </Card>
      )}

      {/* The principles, stated plainly — users deserve to know the reasoning. */}
      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">The principles behind this page</div>
        <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          <li><b>Never zero.</b> Two minutes beats zero, and is not a failed version of thirty. The largest health gain comes from moving from none at all to a little — not from a little to a lot.</li>
          <li><b>Change the environment, do not rely on willpower.</b> Putting the phone in another room is more reliable than intending not to open it. Willpower is the first thing to run out when you are tired.</li>
          <li><b>Add, do not forbid.</b> Adding protein is more likely to last than banning fried food. A rule built on prohibition fails in a hard week, and that failure is usually followed by stopping altogether.</li>
          <li><b>Missing a day is not a failure.</b> What decides the outcome is the average across months, not perfection each day. An app that punishes you for one missed day makes you stop, and stopping is the real loss.</li>
        </ul>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        General advice for healthy people. If you have heart, lung or joint disease, are pregnant,
        or take regular medication, discuss it with a doctor before increasing physical activity.
      </div>
    </div>
  )
}

export default RealisticHealth
