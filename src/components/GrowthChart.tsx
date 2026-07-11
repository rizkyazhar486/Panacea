import { useState } from 'react'
import {
  growthSet,
  lmsAt,
  zscore,
  valueAtZ,
  percentile,
  classifyZ,
  METRIC_LABEL,
  type GrowthMetric,
} from '../lib/growthData'
import { computeBmi } from '../lib/anthro'
import { Badge } from './ui'
import type { Patient } from '../lib/types'

const METRICS: GrowthMetric[] = ['weightForAge', 'heightForAge', 'bmiForAge']
const SD_LINES = [-3, -2, 0, 2, 3]
const SD_STYLE: Record<number, { color: string; dash: string; label: string }> = {
  [-3]: { color: '#FF3131', dash: '2 3', label: '-3 SD' },
  [-2]: { color: '#f59e0b', dash: '4 3', label: '-2 SD' },
  [0]: { color: '#00BF63', dash: '', label: 'Median' },
  [2]: { color: '#f59e0b', dash: '4 3', label: '+2 SD' },
  [3]: { color: '#FF3131', dash: '2 3', label: '+3 SD' },
}

function PediatricChart({ patient, ageYears }: { patient: Patient; ageYears: number }) {
  const [metric, setMetric] = useState<GrowthMetric>('bmiForAge')
  const set = growthSet(patient.sex)
  const rows = set[metric]
  const label = METRIC_LABEL[metric]

  const W = 560
  const H = 320
  const padL = 44
  const padB = 34
  const padT = 14
  const padR = 40

  const xMin = 2
  const xMax = 19

  // Build each SD curve from the per-age LMS fit.
  const curves = SD_LINES.map((z) => ({
    z,
    pts: rows.map((r) => {
      const lms = lmsAt(set, metric, r[0], patient.sex)
      return { age: r[0], v: valueAtZ(z, lms) }
    }),
  }))
  const allV = curves.flatMap((c) => c.pts.map((p) => p.v))
  const yMin = Math.min(...allV) * 0.96
  const yMax = Math.max(...allV) * 1.04

  const px = (age: number) => padL + ((age - xMin) / (xMax - xMin)) * (W - padL - padR)
  const py = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB)
  const poly = (pts: { age: number; v: number }[]) =>
    pts.map((p) => `${px(p.age).toFixed(1)},${py(p.v).toFixed(1)}`).join(' ')

  const patientValue =
    metric === 'weightForAge'
      ? patient.weightKg
      : metric === 'heightForAge'
        ? patient.heightCm
        : computeBmi(patient.weightKg, patient.heightCm).bmi

  const inRange = ageYears >= xMin && ageYears <= xMax
  const lms = lmsAt(set, metric, ageYears, patient.sex)
  const z = zscore(patientValue, lms)
  const pct = percentile(z)
  const cls = classifyZ(metric, z)

  const yTicks = 5
  const xTicks = [2, 5, 8, 11, 14, 17, 19]

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              metric === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
          >
            {METRIC_LABEL[m].short}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]">
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const v = yMin + ((yMax - yMin) / yTicks) * i
            const y = py(v)
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eef2ef" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9aa5a0">
                  {v.toFixed(0)}
                </text>
              </g>
            )
          })}
          {xTicks.map((t) => (
            <text key={t} x={px(t)} y={H - padB + 14} textAnchor="middle" fontSize="9" fill="#9aa5a0">
              {t}
            </text>
          ))}
          <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#9aa5a0">
            Age (years)
          </text>

          {/* normal band ±2 SD shaded */}
          <polygon
            points={`${poly(curves.find((c) => c.z === 2)!.pts)} ${poly([...curves.find((c) => c.z === -2)!.pts].reverse())}`}
            fill="#00BF63"
            opacity="0.07"
          />

          {curves.map((c) => {
            const st = SD_STYLE[c.z]
            return (
              <g key={c.z}>
                <polyline
                  points={poly(c.pts)}
                  fill="none"
                  stroke={st.color}
                  strokeWidth={c.z === 0 ? 2.2 : 1.2}
                  strokeDasharray={st.dash}
                />
                <text x={W - padR + 2} y={py(c.pts[c.pts.length - 1].v) + 3} fontSize="8" fill={st.color}>
                  {st.label}
                </text>
              </g>
            )
          })}

          {inRange && (
            <g>
              <line x1={px(ageYears)} y1={padT} x2={px(ageYears)} y2={H - padB} stroke="#0c1410" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
              <circle cx={px(ageYears)} cy={py(patientValue)} r="5.5" fill="#0c1410" stroke="#fff" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label.short}</div>
          <div className="text-xl font-extrabold">
            {patientValue} <span className="text-xs font-medium text-neutral-400">{label.unit}</span>
          </div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Z-score (SD)</div>
          <div className={`text-xl font-extrabold ${Math.abs(z) > 2 ? 'text-accent' : 'text-brand-dark'}`}>
            {z >= 0 ? '+' : ''}
            {z.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Percentile</div>
          <div className="text-xl font-extrabold">P{pct}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-neutral-500">Assessment ({label.short})</span>
        <Badge tone={cls.tone}>{cls.kesan}</Badge>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
        Z-scores are computed using the LMS method (Cole) — consistent with WHO/CDC standards. Reference
        curves are derived from tabulated percentile points.
      </p>
    </div>
  )
}

function AdultBmiChart({ patient }: { patient: Patient }) {
  const { bmi, kesan, tone } = computeBmi(patient.weightKg, patient.heightCm)
  const bands = [
    { from: 12, to: 18.5, label: 'Underweight', color: '#fbbf24' },
    { from: 18.5, to: 23, label: 'Normal', color: '#00BF63' },
    { from: 23, to: 25, label: 'At risk', color: '#f59e0b' },
    { from: 25, to: 30, label: 'Obese I', color: '#fb7185' },
    { from: 30, to: 40, label: 'Obese II', color: '#FF3131' },
  ]
  const min = 12
  const max = 40
  const pct = (v: number) => ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Adult BMI</div>
          <div className="text-3xl font-extrabold">
            {bmi} <span className="text-base font-medium text-neutral-400">kg/m²</span>
          </div>
        </div>
        <Badge tone={tone}>{kesan}</Badge>
      </div>
      <div className="relative mt-4 h-8 w-full overflow-hidden rounded-full">
        <div className="flex h-full w-full">
          {bands.map((b) => (
            <div key={b.label} style={{ width: `${((b.to - b.from) / (max - min)) * 100}%`, background: b.color }} className="h-full" />
          ))}
        </div>
        <div className="absolute top-0 h-8" style={{ left: `calc(${pct(bmi)}% - 1px)` }}>
          <div className="h-8 w-0.5 bg-ink" />
          <div className="absolute -top-1 -translate-x-1/2 rounded-full border-2 border-ink bg-white px-1 text-[10px] font-bold">▲</div>
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
        <span>18.5</span>
        <span>23</span>
        <span>25</span>
        <span>30</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {bands.map((b) => (
          <span key={b.label} className="flex items-center gap-1 text-[11px] text-neutral-500">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} /> {b.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-400">Asia-Pacific adult BMI classification (WHO).</p>
    </div>
  )
}

export function GrowthChart({ patient, ageYears }: { patient: Patient; ageYears: number }) {
  if (ageYears >= 2 && ageYears <= 19) return <PediatricChart patient={patient} ageYears={ageYears} />
  return <AdultBmiChart patient={patient} />
}
