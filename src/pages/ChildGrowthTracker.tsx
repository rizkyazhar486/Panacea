import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from '../components/ui'
import { IconChartUp } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Child Growth Tracker — longitudinal weight-for-age & height-for-age
// tracking against WHO Child Growth Standards (2006), 0-60 months. Unlike a
// single-measurement percentile calculator, this records a child's actual
// visits over time and plots their real growth trajectory against the WHO
// reference bands — the view a clinician can show a parent directly to
// explain whether a child is tracking normally, tapering off (a warning
// sign) or catching up.
//
// Reference medians/SDs below are the same simplified checkpoint-based
// estimator used elsewhere in this app (0/6/12/24/36/48/60mo, linear
// interpolation, WHO-published coefficient of variation) — a screening
// approximation, not the full monthly-resolution LMS table. For definitive
// clinical use, cross-check against the official WHO growth chart.
// ─────────────────────────────────────────────────────────────────────────────

const CHECKPOINTS_MO = [0, 6, 12, 24, 36, 48, 60]
const WEIGHT_M: Record<'M' | 'F', number[]> = { M: [3.3, 7.9, 9.6, 12.2, 14.3, 16.3, 18.3], F: [3.2, 7.3, 8.9, 11.5, 13.9, 16.1, 18.2] }
const WEIGHT_SD: Record<'M' | 'F', number[]> = { M: [0.4, 0.9, 1.1, 1.5, 1.8, 2.1, 2.4], F: [0.4, 0.9, 1.1, 1.5, 1.9, 2.2, 2.6] }
const HEIGHT_M: Record<'M' | 'F', number[]> = { M: [49.9, 67.6, 75.7, 87.1, 96.1, 103.3, 110.0], F: [49.1, 65.7, 74.0, 85.7, 95.1, 102.7, 109.4] }
const HEIGHT_SD: Record<'M' | 'F', number[]> = { M: [1.9, 2.3, 2.6, 3.2, 3.6, 3.9, 4.2], F: [1.9, 2.3, 2.6, 3.2, 3.6, 4.0, 4.3] }

function interp(x: number, xs: number[], ys: number[]): number {
  const a = Math.max(xs[0], Math.min(xs[xs.length - 1], x))
  for (let i = 0; i < xs.length - 1; i++) {
    if (a >= xs[i] && a <= xs[i + 1]) {
      const t = (a - xs[i]) / (xs[i + 1] - xs[i])
      return ys[i] + t * (ys[i + 1] - ys[i])
    }
  }
  return ys[ys.length - 1]
}

interface Visit { id: string; ageMo: number; weightKg: number; heightCm: number }
const KEY = 'pmd_child_growth_v1'

function load(): { sex: 'M' | 'F'; visits: Visit[] } {
  try { return JSON.parse(localStorage.getItem(KEY) || '') } catch { return { sex: 'M', visits: [] } }
}

function zClass(z: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (z < -3) return { label: 'Severely low', tone: 'critical' }
  if (z < -2) return { label: 'Low', tone: 'low' }
  if (z <= 2) return { label: 'Normal', tone: 'brand' }
  return { label: 'High', tone: 'low' }
}

export function ChildGrowthTracker() {
  const [state, setState] = useState(load)
  const [ageMo, setAgeMo] = useState(0)
  const [weightKg, setWeightKg] = useState(0)
  const [heightCm, setHeightCm] = useState(0)

  function persist(next: typeof state) {
    setState(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  function addVisit() {
    if (weightKg <= 0 || heightCm <= 0) return
    const visit: Visit = { id: Math.random().toString(36).slice(2), ageMo, weightKg, heightCm }
    const visits = [...state.visits, visit].sort((a, b) => a.ageMo - b.ageMo)
    persist({ ...state, visits })
    setWeightKg(0); setHeightCm(0)
  }

  function removeVisit(id: string) {
    persist({ ...state, visits: state.visits.filter((v) => v.id !== id) })
  }

  const weightData = useMemo(() => {
    const ages = Array.from({ length: 61 }, (_, i) => i)
    return ages.map((mo) => {
      const m = interp(mo, CHECKPOINTS_MO, WEIGHT_M[state.sex])
      const sd = interp(mo, CHECKPOINTS_MO, WEIGHT_SD[state.sex])
      const visit = state.visits.find((v) => v.ageMo === mo)
      return { mo, median: +m.toFixed(1), upper2: +(m + 2 * sd).toFixed(1), lower2: +(m - 2 * sd).toFixed(1), child: visit ? visit.weightKg : undefined }
    })
  }, [state.sex, state.visits])

  const heightData = useMemo(() => {
    const ages = Array.from({ length: 61 }, (_, i) => i)
    return ages.map((mo) => {
      const m = interp(mo, CHECKPOINTS_MO, HEIGHT_M[state.sex])
      const sd = interp(mo, CHECKPOINTS_MO, HEIGHT_SD[state.sex])
      const visit = state.visits.find((v) => v.ageMo === mo)
      return { mo, median: +m.toFixed(1), upper2: +(m + 2 * sd).toFixed(1), lower2: +(m - 2 * sd).toFixed(1), child: visit ? visit.heightCm : undefined }
    })
  }, [state.sex, state.visits])

  const latest = state.visits[state.visits.length - 1]
  const latestWaz = latest ? (latest.weightKg - interp(latest.ageMo, CHECKPOINTS_MO, WEIGHT_M[state.sex])) / interp(latest.ageMo, CHECKPOINTS_MO, WEIGHT_SD[state.sex]) : null
  const latestHaz = latest ? (latest.heightCm - interp(latest.ageMo, CHECKPOINTS_MO, HEIGHT_M[state.sex])) / interp(latest.ageMo, CHECKPOINTS_MO, HEIGHT_SD[state.sex]) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Child Growth Tracker" subtitle="Plot a child's weight & height over time against WHO growth standards" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Unlike a single-visit percentile check, this records every visit and plots the child's actual
          trajectory against the WHO Child Growth Standards (2006), 0-60 months — a view worth showing
          parents directly. A flattening or downward-crossing trend across visits is more meaningful than
          any single measurement.
        </p>
        <div className="mt-3">
          <Field label="Sex">
            <select className={inputClass} value={state.sex} onChange={(e) => persist({ ...state, sex: e.target.value as 'M' | 'F' })}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Log a visit</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Age (months)">
            <input className={inputClass} type="number" min={0} max={60} value={ageMo || ''} onChange={(e) => setAgeMo(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Weight (kg)">
            <input className={inputClass} type="number" step="0.1" min={0} value={weightKg || ''} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Height (cm)">
            <input className={inputClass} type="number" step="0.1" min={0} value={heightCm || ''} onChange={(e) => setHeightCm(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <Button onClick={addVisit} disabled={weightKg <= 0 || heightCm <= 0} className="mt-3 w-full sm:w-auto">Add visit</Button>

        {state.visits.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {state.visits.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-xs dark:bg-white/5">
                <span className="font-semibold text-neutral-600 dark:text-neutral-300">{v.ageMo}mo — {v.weightKg}kg, {v.heightCm}cm</span>
                <button onClick={() => removeVisit(v.id)} className="font-semibold text-rose-500 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {latest && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Latest visit ({latest.ageMo} months)</div>
          <div className="mt-2 flex flex-wrap gap-4">
            <div>
              <div className="text-[11px] text-neutral-400">Weight-for-age</div>
              <Badge tone={zClass(latestWaz!).tone}>{zClass(latestWaz!).label} (z={latestWaz!.toFixed(1)})</Badge>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400">Height-for-age</div>
              <Badge tone={zClass(latestHaz!).tone}>{zClass(latestHaz!).label} (z={latestHaz!.toFixed(1)})</Badge>
            </div>
          </div>
        </Card>
      )}

      {state.visits.length > 0 && (
        <>
          <Card className="!p-4">
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-400">Weight-for-age (kg)</div>
            <div className="h-56 w-full">
              <ResponsiveContainer>
                <LineChart data={weightData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="mo" tick={{ fontSize: 10 }} label={{ value: 'Age (months)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="upper2" name="+2SD" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="median" name="Median" stroke="#00BF63" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lower2" name="-2SD" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="child" name="This child" stroke="#0B7A4B" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="!p-4">
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-400">Height-for-age (cm)</div>
            <div className="h-56 w-full">
              <ResponsiveContainer>
                <LineChart data={heightData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="mo" tick={{ fontSize: 10 }} label={{ value: 'Age (months)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="upper2" name="+2SD" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="median" name="Median" stroke="#00BF63" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lower2" name="-2SD" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="child" name="This child" stroke="#0B7A4B" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        WHO Child Growth Standards (2006), 0-60 months. Reference curves use a simplified
        checkpoint-based estimator (screening-grade, not the full monthly LMS table) — for definitive
        clinical use, cross-check against the official WHO growth chart. Not a diagnosis; discuss any
        growth concern with a pediatrician.
      </div>
    </div>
  )
}

export default ChildGrowthTracker
