import { useMemo } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity, IconHeart, IconRun } from '../components/icons'

interface AthleteProfile {
  age?: number
  g?: 'M' | 'F'
  weight?: number
  hrRest?: number
  hrMax?: number
  acuteLoad?: number
  chronicLoad?: number
  vo2Trend?: 'up' | 'flat' | 'down'
  hrv?: number
  hrvBaseline?: number
  recoveryHrs?: number
  ltHr?: number
  ltPace?: string
  teAerobic?: number
  teAnaerobic?: number
  sleepScore?: number
}

const KEY = 'pm_athlete_profile'

function loadProfile(): AthleteProfile {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as AthleteProfile } catch { return {} }
}

function pctDelta(value?: number, baseline?: number) {
  if (!value || !baseline) return null
  return ((value - baseline) / baseline) * 100
}

function vo2Estimate(hrMax?: number, hrRest?: number) {
  if (!hrMax || !hrRest || hrMax <= hrRest) return null
  return 15.3 * (hrMax / hrRest)
}

function confidenceLabel(measured: boolean, enoughHistory: boolean) {
  if (measured && enoughHistory) return 'Higher confidence'
  if (measured || enoughHistory) return 'Moderate confidence'
  return 'Exploratory estimate'
}

export function AthleteScience() {
  const p = useMemo(loadProfile, [])
  const estimatedHrMax = p.hrMax && p.hrMax > 0 ? p.hrMax : p.age ? 208 - 0.7 * p.age : undefined
  const vo2 = vo2Estimate(estimatedHrMax, p.hrRest)
  const hrvDelta = pctDelta(p.hrv, p.hrvBaseline)
  const ratio = p.chronicLoad && p.chronicLoad > 0 && p.acuteLoad != null
    ? p.acuteLoad / p.chronicLoad
    : null
  const hasMeasuredHrMax = Boolean(p.hrMax && p.hrMax > 0)
  const enoughLoadHistory = Boolean(p.chronicLoad && p.chronicLoad > 0)
  const confidence = confidenceLabel(hasMeasuredHrMax, enoughLoadHistory)

  const loadInterpretation = ratio == null
    ? 'Not enough load history to compare recent and habitual training.'
    : ratio > 1.5
      ? 'Recent load is substantially above the recorded baseline. Treat this as a workload-change signal, not a stand-alone injury prediction.'
      : ratio < 0.8
        ? 'Recent load is below the recorded baseline. This may be planned recovery, tapering, illness, or reduced training.'
        : 'Recent load is broadly similar to the recorded baseline. This does not by itself prove that training is optimal or safe.'

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconRun />}
        title="Athlete Science"
        subtitle="Performance analytics with assumptions, uncertainty and physiological context"
      />

      <Card className="!p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500">Evidence mode</div>
            <h2 className="mt-1 text-xl font-black text-ink dark:text-white">{confidence}</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-neutral-500">
            estimates ≠ laboratory measurements
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Every metric below is interpreted as a trend in the same athlete. A wearable-derived score, HR-based estimate,
          or workload ratio should support decisions together with symptoms, sleep, session RPE, performance and training history.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="VO₂ estimate"
          value={vo2 ? vo2.toFixed(1) : '—'}
          unit="mL/kg/min"
          note={hasMeasuredHrMax ? 'Uth HR ratio estimate using measured HRmax.' : 'Uth HR ratio estimate; HRmax is age-estimated (208 − 0.7×age).'}
        />
        <Metric
          title="HRV vs baseline"
          value={hrvDelta == null ? '—' : `${hrvDelta >= 0 ? '+' : ''}${hrvDelta.toFixed(1)}%`}
          unit={p.hrv ? `${p.hrv} ms` : undefined}
          note="Interpret against your own multi-week baseline; a single low night is nonspecific."
        />
        <Metric
          title="Recent : habitual load"
          value={ratio == null ? '—' : ratio.toFixed(2)}
          unit="ratio"
          note="Descriptive workload context only; not a deterministic injury-risk score."
        />
        <Metric
          title="Recovery"
          value={p.recoveryHrs != null && p.recoveryHrs > 0 ? `${Math.round(p.recoveryHrs)}` : '—'}
          unit={p.recoveryHrs ? 'hours' : undefined}
          note="Use alongside soreness, sleep, HRV/RHR trend and actual performance."
        />
      </div>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity />} title="Load interpretation" subtitle="What the ratio can and cannot tell you" />
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{loadInterpretation}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Mini label="Acute / recent" value={p.acuteLoad != null ? p.acuteLoad.toFixed(0) : '—'} />
          <Mini label="Chronic / habitual" value={p.chronicLoad != null ? p.chronicLoad.toFixed(0) : '—'} />
          <Mini label="VO₂ trend" value={p.vo2Trend ?? '—'} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
          ACWR literature is heterogeneous and remains debated. Avoid labels such as “safe zone” or “high injury risk” from the ratio alone;
          session-specific spikes, tissue tolerance, prior injury, sport, surface, strength and recovery all matter.
        </p>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconHeart />} title="Physiology snapshot" subtitle="Use physiology before gamified scores" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ScienceRow
            label="Heart-rate reserve"
            value={estimatedHrMax && p.hrRest ? `${Math.max(0, estimatedHrMax - p.hrRest).toFixed(0)} bpm` : '—'}
            formula="HRR = HRmax − HRrest"
          />
          <ScienceRow
            label="Lactate-threshold HR"
            value={p.ltHr ? `${p.ltHr} bpm` : '—'}
            formula="Prefer measured field/lab threshold over fixed %HRmax"
          />
          <ScienceRow
            label="Sleep score"
            value={p.sleepScore ? `${p.sleepScore}/100` : '—'}
            formula="Device score is supportive; duration/regularity remain primary context"
          />
          <ScienceRow
            label="Training effect"
            value={p.teAerobic || p.teAnaerobic ? `Aer ${p.teAerobic ?? 0} · Ana ${p.teAnaerobic ?? 0}` : '—'}
            formula="Vendor-derived score; do not compare as if it were VO₂ or lactate"
          />
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500">Core formulas</div>
        <div className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <p><b className="text-ink dark:text-white">VO₂ estimate:</b> VO₂max ≈ 15.3 × HRmax / HRrest (non-exercise estimate; not CPET).</p>
          <p><b className="text-ink dark:text-white">Karvonen target HR:</b> HRtarget = HRrest + intensity × (HRmax − HRrest).</p>
          <p><b className="text-ink dark:text-white">Fick principle:</b> VO₂ = cardiac output × (arterial O₂ content − venous O₂ content).</p>
          <p><b className="text-ink dark:text-white">Cardiac output:</b> Q = HR × stroke volume.</p>
        </div>
      </Card>
    </div>
  )
}

function Metric({ title, value, unit, note }: { title: string; value: string; unit?: string; note: string }) {
  return (
    <Card className="!p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">{title}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-black tabular-nums text-ink dark:text-white">{value}</span>
        {unit && <span className="text-[11px] font-semibold text-neutral-500">{unit}</span>}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{note}</p>
    </Card>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1 text-lg font-black tabular-nums text-ink dark:text-white">{value}</div>
    </div>
  )
}

function ScienceRow({ label, value, formula }: { label: string; value: string; formula: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold text-neutral-500">{label}</span>
        <span className="text-base font-black tabular-nums text-ink dark:text-white">{value}</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{formula}</p>
    </div>
  )
}

export default AthleteScience
