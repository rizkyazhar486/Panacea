import { useMemo, useState } from 'react'
import { Card, inputClass } from './ui'
import {
  DEFAULT_GAP_SIGNALS,
  GAP_NAVIGATOR_TRUTH_RULES,
  buildGapReport,
  careFriction,
  type CareFrictionInput,
  type GapSignal,
  type GapStatus,
} from '../lib/healthGapNavigator'

const STATUS_LABEL: Record<GapStatus, string> = {
  clear: 'Clear',
  partial: 'Partial',
  missing: 'Missing',
  blocked: 'Blocked',
}

const STATUS_CLASS: Record<GapStatus, string> = {
  clear: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
  partial: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300',
  missing: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300',
  blocked: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300',
}

const DEFAULT_FRICTION: CareFrictionInput = {
  waitingHours: 24,
  travelMinutes: 45,
  outOfPocketCost: 250000,
  monthlyDisposableBudget: 2000000,
  numberOfSteps: 3,
  missedWorkHours: 2,
  digitalBarrier: 1,
}

function pct(value: number) {
  return `${Math.round(value)}%`
}

export function HealthGapNavigator() {
  const [signals, setSignals] = useState<GapSignal[]>(() => DEFAULT_GAP_SIGNALS.map((item) => ({ ...item })))
  const [frictionInput, setFrictionInput] = useState<CareFrictionInput>(DEFAULT_FRICTION)

  const report = useMemo(() => buildGapReport(signals), [signals])
  const friction = useMemo(() => careFriction(frictionInput), [frictionInput])

  const updateSignal = (id: string, status: GapStatus) => {
    setSignals((current) => current.map((item) => item.id === id ? { ...item, status } : item))
  }

  const updateNumber = (key: keyof CareFrictionInput, raw: string) => {
    const value = Number(raw)
    setFrictionInput((current) => ({ ...current, [key]: Number.isFinite(value) ? value : 0 }))
  }

  const copyQuestionBudget = async () => {
    const text = report.topQuestions
      .map((item, index) => `${index + 1}. ${item.question}\n   Gap: ${item.label}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be unavailable in embedded or non-secure contexts.
    }
  }

  return (
    <Card className="!p-5 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand">Panacea signature tool</div>
          <h2 className="mt-1 text-xl font-black text-ink dark:text-white">Gap Navigator</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-500">
            Find what is still unclear, unsafe, unaffordable, unowned or unsupported before limited appointment time is spent.
            It measures care-plan execution gaps — never disease severity.
          </p>
        </div>
        <div className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3 text-center">
          <div className="text-3xl font-black text-brand-dark dark:text-brand">{report.bridgeScore}</div>
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">bridge score / 100</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Care-plan gap radar</div>
            <div className="text-[11px] text-neutral-500">{report.openGapCount} open · {report.blockedCount} blocked</div>
          </div>
          {signals.map((signal) => (
            <div key={signal.id} className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink dark:text-white">{signal.label}</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{signal.prompt}</div>
                </div>
                <select
                  aria-label={`${signal.label} status`}
                  className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-bold outline-none ${STATUS_CLASS[signal.status]}`}
                  value={signal.status}
                  onChange={(event) => updateSignal(signal.id, event.target.value as GapStatus)}
                >
                  {(Object.keys(STATUS_LABEL) as GapStatus[]).map((status) => (
                    <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Question budget</div>
                <div className="text-[11px] text-neutral-500">Top 3 gaps to spend appointment time on</div>
              </div>
              <button
                type="button"
                onClick={copyQuestionBudget}
                className="rounded-xl border border-neutral-200 px-2.5 py-1.5 text-[11px] font-bold text-neutral-600 hover:border-brand/40 hover:text-brand-dark dark:border-white/10 dark:text-neutral-300"
              >
                Copy
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {report.topQuestions.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  No open gap is currently marked. Re-check whenever the plan changes.
                </div>
              ) : report.topQuestions.map((finding, index) => (
                <div key={`${finding.id}-${index}`} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  <div className="text-[10px] font-black uppercase tracking-wide text-brand">#{index + 1} · {finding.domain}</div>
                  <div className="mt-1 text-xs font-semibold leading-relaxed text-ink dark:text-white">{finding.question}</div>
                  <div className="mt-1 text-[10px] text-neutral-500">Triggered by: {finding.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Care friction index</div>
                <div className="text-[11px] text-neutral-500">Implementation burden, not medical risk</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-ink dark:text-white">{friction.score}</div>
                <div className="text-[10px] font-bold uppercase text-neutral-500">{friction.level}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Wait (hours)
                <input className={`${inputClass} mt-1 !py-2`} type="number" min="0" value={frictionInput.waitingHours} onChange={(e) => updateNumber('waitingHours', e.target.value)} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Travel (min)
                <input className={`${inputClass} mt-1 !py-2`} type="number" min="0" value={frictionInput.travelMinutes} onChange={(e) => updateNumber('travelMinutes', e.target.value)} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Out-of-pocket
                <input className={`${inputClass} mt-1 !py-2`} type="number" min="0" value={frictionInput.outOfPocketCost} onChange={(e) => updateNumber('outOfPocketCost', e.target.value)} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Monthly budget
                <input className={`${inputClass} mt-1 !py-2`} type="number" min="1" value={frictionInput.monthlyDisposableBudget} onChange={(e) => updateNumber('monthlyDisposableBudget', e.target.value)} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Care steps
                <input className={`${inputClass} mt-1 !py-2`} type="number" min="1" value={frictionInput.numberOfSteps} onChange={(e) => updateNumber('numberOfSteps', e.target.value)} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Missed work (h)
                <input className={`${inputClass} mt-1 !py-2`} type="number" min="0" value={frictionInput.missedWorkHours} onChange={(e) => updateNumber('missedWorkHours', e.target.value)} />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] text-neutral-500">
              <div className="rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-white/5">wait {pct(friction.components.waiting)}</div>
              <div className="rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-white/5">travel {pct(friction.components.travel)}</div>
              <div className="rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-white/5">cost {pct(friction.components.cost)}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 dark:border-sky-400/20 dark:bg-sky-400/5">
            <div className="text-xs font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Unknowns-first rule</div>
            <div className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              Panacea should preserve an unknown as unknown instead of filling it with plausible-looking AI text. The ledger currently contains {report.unknownLedger.length} unresolved item{report.unknownLedger.length === 1 ? '' : 's'}.
            </div>
          </div>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-3 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-neutral-500">Truth boundaries</summary>
        <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-neutral-500">
          {GAP_NAVIGATOR_TRUTH_RULES.map((rule) => <li key={rule}>• {rule}</li>)}
        </ul>
      </details>
    </Card>
  )
}

export default HealthGapNavigator
