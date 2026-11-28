import { useEffect, useRef } from 'react'
import type { AnesthesiaPhysiologyFrame } from '../../domains/body-exposure/engine/roboticsAnesthesiaEngine'

export interface AnesthesiaMonitorCanvasProps {
  readonly frame: AnesthesiaPhysiologyFrame
  readonly regionalLevel: 'brachial_plexus' | 'neuraxial_T10' | 'neuraxial_T4'
}

interface ChannelSpec {
  readonly label: string
  readonly unit: string
  readonly color: string
  readonly valueText: (f: AnesthesiaPhysiologyFrame) => string
  readonly sample: (tSec: number, f: AnesthesiaPhysiologyFrame) => number
}

function ecgLeadII(phase: number): number {
  const p = ((phase % 1) + 1) % 1
  if (p > 0.1 && p < 0.19) return 0.16 * Math.sin(((p - 0.1) / 0.09) * Math.PI)
  if (p >= 0.24 && p < 0.265) return -0.18
  if (p >= 0.265 && p < 0.305) return 0.95 - Math.abs(p - 0.285) * 42
  if (p >= 0.305 && p < 0.335) return -0.28
  if (p >= 0.44 && p < 0.59) return 0.28 * Math.sin(((p - 0.44) / 0.15) * Math.PI)
  return 0
}

function spo2Pleth(phase: number, spo2: number): number {
  const amp = Math.max(0.35, Math.min(1, (spo2 - 80) / 20))
  const p = ((phase % 1) + 1) % 1
  if (p < 0.22) return amp * Math.pow(Math.sin((p / 0.22) * (Math.PI / 2)), 1.4)
  if (p < 0.55) {
    const dicrotic = 0.16 * Math.exp(-Math.pow((p - 0.38) / 0.055, 2))
    return amp * (1 - (p - 0.22) / 0.45) + dicrotic
  }
  return amp * Math.max(0, 0.26 * (1 - (p - 0.55) / 0.45))
}

function capnographEtCo2(phase: number, etco2: number): number {
  const norm = Math.max(0.35, Math.min(1, etco2 / 55))
  const p = ((phase % 1) + 1) % 1
  if (p < 0.45) return 0
  if (p < 0.52) return norm * ((p - 0.45) / 0.07)
  if (p < 0.88) return norm * (0.94 + ((p - 0.52) / 0.36) * 0.08)
  return norm * Math.max(0, 1 - (p - 0.88) / 0.08)
}

function processedEegBis(tSec: number, bis: number): number {
  if (bis > 75) {
    return 0.32 * Math.sin(tSec * 28) + 0.18 * Math.sin(tSec * 46)
  }
  if (bis >= 40) {
    return 0.52 * Math.sin(tSec * 15) + 0.2 * Math.cos(tSec * 9)
  }
  const burstGate = Math.sin(tSec * 1.4) > 0.25 ? 1 : 0.12
  return burstGate * (0.48 * Math.sin(tSec * 11))
}

const CHANNELS: readonly ChannelSpec[] = [
  {
    label: 'ECG II',
    unit: 'bpm',
    color: '#34d399',
    valueText: (f) => `${f.hrBpm}`,
    sample: (t, f) => ecgLeadII((t * f.hrBpm) / 60),
  },
  {
    label: 'SpO₂ Pleth',
    unit: '%',
    color: '#22d3ee',
    valueText: (f) => `${f.spo2Pct}%`,
    sample: (t, f) => spo2Pleth((t * f.hrBpm) / 60, f.spo2Pct) * 1.6 - 0.65,
  },
  {
    label: 'EtCO₂',
    unit: 'mmHg',
    color: '#fbbf24',
    valueText: (f) => `${f.etco2MmHg}`,
    sample: (t, f) => capnographEtCo2((t * f.rrPerMin) / 60, f.etco2MmHg) * 1.5 - 0.65,
  },
  {
    label: 'BIS EEG',
    unit: 'idx',
    color: '#c084fc',
    valueText: (f) => `${f.conceptualBisIndex}`,
    sample: (t, f) => processedEegBis(t, f.conceptualBisIndex),
  },
]

const REGIONAL_COPY: Record<AnesthesiaMonitorCanvasProps['regionalLevel'], { title: string; zone: string }> = {
  brachial_plexus: {
    title: 'Brachial Plexus (C5–T1) Peripheral Block',
    zone: 'Upper extremity C5–T1 sensory & motor distribution',
  },
  neuraxial_T10: {
    title: 'Neuraxial Block at T10 Umbilical Level',
    zone: 'Lower abdomen, pelvic viscera & lower limbs',
  },
  neuraxial_T4: {
    title: 'High Thoracic T4 Block (Cardioaccelerator Zone)',
    zone: 'T4 nipple line & T1–T4 sympathetic fibers',
  },
}

export default function AnesthesiaMonitorCanvas({ frame, regionalLevel }: AnesthesiaMonitorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef(frame)
  frameRef.current = frame

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let rafId = 0
    let disposed = false
    const startMs = performance.now()

    const renderWaveforms = (nowMs: number) => {
      if (disposed) return
      const width = Math.max(320, canvas.clientWidth || 560)
      const height = 216
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#030712'
      ctx.fillRect(0, 0, width, height)

      // Clinical oscilloscope subtle grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)'
      ctx.lineWidth = 1
      for (let gx = 0; gx < width; gx += 32) {
        ctx.beginPath()
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, height)
        ctx.stroke()
      }

      const f = frameRef.current
      const laneH = height / CHANNELS.length
      const elapsedSec = reducedMotion ? 2.4 : (nowMs - startMs) / 1000
      const windowSec = 6.0
      const sweepX = ((elapsedSec % windowSec) / windowSec) * width

      CHANNELS.forEach((ch, idx) => {
        const yMid = idx * laneH + laneH * 0.56
        const yScale = laneH * 0.34

        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
          ctx.beginPath()
          ctx.moveTo(0, idx * laneH)
          ctx.lineTo(width, idx * laneH)
          ctx.stroke()
        }

        // Sweep channel waveform with small blanking gap ahead of phosphor head
        ctx.strokeStyle = ch.color
        ctx.lineWidth = 1.8
        ctx.beginPath()
        let started = false
        for (let px = 0; px < width; px += 2) {
          const distAhead = (px - sweepX + width) % width
          if (!reducedMotion && distAhead > 0 && distAhead < 14) {
            started = false
            continue
          }
          const tSample = elapsedSec - distAhead * (windowSec / width)
          const py = yMid - ch.sample(tSample, f) * yScale
          if (!started) {
            ctx.moveTo(px, py)
            started = true
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.stroke()
      })

      ctx.restore()
      if (!reducedMotion && !disposed) {
        rafId = requestAnimationFrame(renderWaveforms)
      }
    }

    rafId = requestAnimationFrame(renderWaveforms)
    return () => {
      disposed = true
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const region = REGIONAL_COPY[regionalLevel]
  const fibers = [
    { label: 'B Sympathetic', val: frame.fiberBlockade.autonomicSympatheticPct, cls: 'bg-amber-400' },
    { label: 'C Pain', val: frame.fiberBlockade.cFiberPainPct, cls: 'bg-rose-400' },
    { label: 'Aδ Temp', val: frame.fiberBlockade.aDeltaTempPct, cls: 'bg-cyan-400' },
    { label: 'Aβ Touch', val: frame.fiberBlockade.aBetaTouchPct, cls: 'bg-emerald-400' },
    { label: 'Aα Motor', val: frame.fiberBlockade.aAlphaMotorPct, cls: 'bg-violet-400' },
  ] as const

  return (
    <div
      data-anesthesia-monitor="v1"
      className="dark space-y-2.5 rounded-2xl border border-emerald-400/25 bg-slate-950 p-3 text-white"
      style={{ backgroundColor: '#030712' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 font-mono text-[10px]">
        <span className="font-black uppercase tracking-wider text-emerald-200">
          OR Multi-Parameter Monitor · ECG · Pleth · EtCO₂ · BIS
        </span>
        <span className="text-slate-400">
          EDUCATIONAL SANDBOX · clinically_reviewed=false · NOT FOR PATIENT MONITORING OR DOSING
        </span>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl border border-white/10 bg-slate-950 lg:col-span-3"
          style={{ height: 216, backgroundColor: '#030712' }}
          aria-label="Simulated operating room vital sign oscilloscope waveforms"
        />

        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1 font-mono text-[10px]">
          {CHANNELS.map((ch) => (
            <div key={ch.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/90 px-2.5 py-1.5">
              <div>
                <div className="text-[9px] text-slate-400">{ch.label}</div>
                <div className="text-xs font-black" style={{ color: ch.color }}>
                  {ch.valueText(frame)} <span className="text-[9px] opacity-70">{ch.unit}</span>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
            </div>
          ))}
        </div>
      </div>

      {frame.modality === 'local_regional' && (
        <div
          data-regional-dermatome={regionalLevel}
          className="grid gap-2.5 rounded-xl border border-cyan-400/20 bg-slate-950/90 p-2.5 sm:grid-cols-3"
        >
          <svg
            viewBox="0 0 140 120"
            className="mx-auto h-28 w-36"
            role="img"
            aria-label={region.title}
          >
            {/* Head */}
            <circle cx="70" cy="16" r="10" fill="#1e293b" stroke="#64748b" strokeWidth="1.4" />
            {/* Torso */}
            <rect x="48" y="30" width="44" height="50" rx="10" fill="#0f172a" stroke="#64748b" strokeWidth="1.4" />
            {/* Arms */}
            <rect
              x="24"
              y="32"
              width="18"
              height="44"
              rx="8"
              fill={regionalLevel === 'brachial_plexus' ? 'rgba(34,211,238,0.42)' : '#0f172a'}
              stroke={regionalLevel === 'brachial_plexus' ? '#22d3ee' : '#64748b'}
              strokeWidth="1.4"
            />
            <rect x="98" y="32" width="18" height="44" rx="8" fill="#0f172a" stroke="#64748b" strokeWidth="1.4" />
            {/* Legs */}
            <rect
              x="50"
              y="82"
              width="16"
              height="32"
              rx="6"
              fill={regionalLevel !== 'brachial_plexus' ? 'rgba(52,211,153,0.36)' : '#0f172a'}
              stroke={regionalLevel !== 'brachial_plexus' ? '#34d399' : '#64748b'}
              strokeWidth="1.4"
            />
            <rect
              x="74"
              y="82"
              width="16"
              height="32"
              rx="6"
              fill={regionalLevel !== 'brachial_plexus' ? 'rgba(52,211,153,0.36)' : '#0f172a'}
              stroke={regionalLevel !== 'brachial_plexus' ? '#34d399' : '#64748b'}
              strokeWidth="1.4"
            />
            {/* Neuraxial shaded region */}
            {regionalLevel === 'neuraxial_T10' && (
              <rect x="49" y="56" width="42" height="24" rx="4" fill="rgba(52,211,153,0.4)" />
            )}
            {regionalLevel === 'neuraxial_T4' && (
              <rect x="49" y="38" width="42" height="42" rx="4" fill="rgba(244,63,94,0.38)" stroke="#f43f5e" strokeWidth="1" />
            )}
          </svg>

          <div className="space-y-1.5 font-mono text-[10px] sm:col-span-2">
            <div className="font-black text-cyan-200">{region.title}</div>
            <div className="text-slate-400">{region.zone}</div>
            <div className="grid gap-1 pt-0.5">
              {fibers.map((fb) => (
                <div key={fb.label} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-slate-300">{fb.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full ${fb.cls}`} style={{ width: `${fb.val}%` }} />
                  </div>
                  <span className="w-9 shrink-0 text-right font-black text-slate-200">{fb.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
