import { useState } from 'react'
import { growthSet, classifyGrowth, METRIC_LABEL, type GrowthMetric } from '../lib/growthData'
import { computeBmi } from '../lib/anthro'
import { Badge } from './ui'
import type { Patient } from '../lib/types'

const METRICS: GrowthMetric[] = ['weightForAge', 'heightForAge', 'bmiForAge']

// ---- Pediatric percentile chart (age 2–19) --------------------------------
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
  const padR = 14

  const xMin = 2
  const xMax = 19
  const yMin = Math.min(...rows.map((r) => r[1])) * 0.9
  const yMax = Math.max(...rows.map((r) => r[3])) * 1.05

  const px = (age: number) => padL + ((age - xMin) / (xMax - xMin)) * (W - padL - padR)
  const py = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB)

  const line = (idx: 1 | 2 | 3) =>
    rows.map((r) => `${px(r[0]).toFixed(1)},${py(r[idx]).toFixed(1)}`).join(' ')

  const band =
    rows.map((r) => `${px(r[0]).toFixed(1)},${py(r[3]).toFixed(1)}`).join(' ') +
    ' ' +
    [...rows].reverse().map((r) => `${px(r[0]).toFixed(1)},${py(r[1]).toFixed(1)}`).join(' ')

  const patientValue =
    metric === 'weightForAge'
      ? patient.weightKg
      : metric === 'heightForAge'
        ? patient.heightCm
        : computeBmi(patient.weightKg, patient.heightCm).bmi

  const inRange = ageYears >= xMin && ageYears <= xMax
  const cls = classifyGrowth(set, metric, ageYears, patientValue)

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
          {/* grid + axes */}
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
          <text x={(W) / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#9aa5a0">
            Umur (tahun)
          </text>

          {/* P3–P97 band */}
          <polygon points={band} fill="#00BF63" opacity="0.08" />
          <polyline points={line(1)} fill="none" stroke="#cdd8d2" strokeWidth="1" strokeDasharray="4 3" />
          <polyline points={line(2)} fill="none" stroke="#00BF63" strokeWidth="2" />
          <polyline points={line(3)} fill="none" stroke="#cdd8d2" strokeWidth="1" strokeDasharray="4 3" />

          {/* labels for percentile lines */}
          <text x={W - padR} y={py(rows[rows.length - 1][3]) - 3} textAnchor="end" fontSize="8" fill="#9aa5a0">P97</text>
          <text x={W - padR} y={py(rows[rows.length - 1][2]) - 3} textAnchor="end" fontSize="8" fill="#0b7a4b">P50</text>
          <text x={W - padR} y={py(rows[rows.length - 1][1]) - 3} textAnchor="end" fontSize="8" fill="#9aa5a0">P3</text>

          {/* patient marker */}
          {inRange && (
            <g>
              <line x1={px(ageYears)} y1={padT} x2={px(ageYears)} y2={H - padB} stroke="#FF3131" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={px(ageYears)} cy={py(patientValue)} r="5" fill="#FF3131" stroke="#fff" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="text-neutral-500">{label.title}: </span>
          <span className="font-bold">
            {patientValue} {label.unit}
          </span>
          <span className="text-neutral-400"> @ {ageYears} th</span>
        </div>
        <Badge tone={cls.tone}>{cls.kesan}</Badge>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
        Kurva referensi WHO/CDC (perkiraan, P3–P50–P97). Z-score presisi (LMS) dihitung AI pada workup
        AI-EMR.
      </p>
    </div>
  )
}

// ---- Adult BMI band chart -------------------------------------------------
function AdultBmiChart({ patient }: { patient: Patient }) {
  const { bmi, kesan, tone } = computeBmi(patient.weightKg, patient.heightCm)
  // Asia-Pacific bands
  const bands = [
    { from: 12, to: 18.5, label: 'Kurang', color: '#fbbf24' },
    { from: 18.5, to: 23, label: 'Normal', color: '#00BF63' },
    { from: 23, to: 25, label: 'Berisiko', color: '#f59e0b' },
    { from: 25, to: 30, label: 'Obesitas I', color: '#fb7185' },
    { from: 30, to: 40, label: 'Obesitas II', color: '#FF3131' },
  ]
  const min = 12
  const max = 40
  const pct = (v: number) => ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">IMT (BMI) Dewasa</div>
          <div className="text-3xl font-extrabold">{bmi} <span className="text-base font-medium text-neutral-400">kg/m²</span></div>
        </div>
        <Badge tone={tone}>{kesan}</Badge>
      </div>
      <div className="relative mt-4 h-8 w-full overflow-hidden rounded-full">
        <div className="flex h-full w-full">
          {bands.map((b) => (
            <div
              key={b.label}
              style={{ width: `${((b.to - b.from) / (max - min)) * 100}%`, background: b.color }}
              className="h-full"
            />
          ))}
        </div>
        {/* marker */}
        <div
          className="absolute top-0 h-8"
          style={{ left: `calc(${pct(bmi)}% - 1px)` }}
        >
          <div className="h-8 w-0.5 bg-ink" />
          <div className="absolute -top-1 -translate-x-1/2 rounded-full border-2 border-ink bg-white px-1 text-[10px] font-bold">
            ▲
          </div>
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
      <p className="mt-2 text-[11px] text-neutral-400">Klasifikasi IMT dewasa Asia-Pasifik (WHO).</p>
    </div>
  )
}

export function GrowthChart({ patient, ageYears }: { patient: Patient; ageYears: number }) {
  // Children/adolescents (2–19y) get growth curves; adults get the BMI band.
  if (ageYears >= 2 && ageYears <= 19) return <PediatricChart patient={patient} ageYears={ageYears} />
  return <AdultBmiChart patient={patient} />
}
