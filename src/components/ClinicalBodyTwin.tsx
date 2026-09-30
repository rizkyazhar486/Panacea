import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { BodyClinicalBridgeProjection, BodyClinicalMarkerStatus } from '../lib/bodyClinicalBridge'

const STATUS: Record<BodyClinicalMarkerStatus, { dot: string; ring: string; label: string }> = {
  normal: { dot: '#00BF63', ring: 'rgba(0,191,99,.28)', label: 'Recorded normal' },
  abnormal: { dot: '#ff5d5d', ring: 'rgba(255,93,93,.3)', label: 'Finding recorded' },
  recorded: { dot: '#f5b942', ring: 'rgba(245,185,66,.28)', label: 'Recorded · not classified' },
  unchecked: { dot: '#64748b', ring: 'rgba(100,116,139,.24)', label: 'Not examined' },
}

function reviewLabel(state: BodyClinicalBridgeProjection['reviewState']) {
  if (state === 'record-signed') return 'Signed record'
  if (state === 'exam-verified') return 'Exam verified'
  return 'Draft context'
}

export function ClinicalBodyTwin({
  projection,
  patientLabel,
}: {
  projection: BodyClinicalBridgeProjection
  patientLabel?: string
}) {
  const reduceMotion = useReducedMotion()
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const active = projection.markers.find((marker) => marker.key === activeKey) ?? null

  return (
    <section
      className="dark mb-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#050708] text-white shadow-[0_28px_90px_rgba(0,0,0,.28)]"
      aria-label="AI-EMR body context"
      data-pmd-unclamped="true"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-black uppercase tracking-[.18em] text-emerald-300/80">AI-EMR · Clinical body context</div>
          <div className="truncate text-sm font-black tracking-[-.02em] text-white/90">{patientLabel || projection.patientId}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[9px] font-black uppercase tracking-[.12em] text-white/45">
          <span className="rounded-full border border-white/10 px-2 py-1">{reviewLabel(projection.reviewState)}</span>
          <span className="rounded-full border border-emerald-300/20 px-2 py-1 text-emerald-200/75">Body Exposure bridge</span>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:items-stretch">
        <aside className="order-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:order-1 lg:grid-cols-1 lg:content-start" aria-label="Latest clinical vitals">
          {projection.signals.length > 0 ? projection.signals.map((signal) => (
            <div key={signal.id} className="min-w-0 border-b border-white/10 pb-2">
              <div className="truncate text-[9px] font-black uppercase tracking-[.12em] text-white/35">{signal.label}</div>
              <div className="mt-1 truncate text-xl font-black tracking-[-.04em] text-white">
                {signal.value}
                {signal.unit ? <span className="ml-1 text-[10px] font-bold tracking-normal text-white/38">{signal.unit}</span> : null}
              </div>
            </div>
          )) : (
            <div className="col-span-full border-b border-white/10 pb-2 text-xs font-bold text-white/35">No recorded vital series</div>
          )}
        </aside>

        <div className="order-1 relative min-h-[360px] overflow-hidden rounded-[24px] border border-white/[.07] bg-black/45 lg:order-2 lg:min-h-[440px]">
          <div className="pointer-events-none absolute inset-x-[14%] top-[12%] h-[65%] rounded-full bg-emerald-300/[.035] blur-3xl" aria-hidden />
          <svg viewBox="0 0 200 440" className="absolute inset-0 m-auto h-[92%] w-auto max-w-[88%]" role="img" aria-label="Reference body silhouette with AI-EMR examination markers">
            <g fill="rgba(226,232,240,.075)" stroke="rgba(226,232,240,.28)" strokeWidth="1.15">
              <circle cx="100" cy="40" r="25" />
              <rect x="87" y="63" width="26" height="17" rx="6" />
              <path d="M62 84 Q100 73 138 84 L149 151 Q151 197 142 248 L131 248 Q126 202 124 169 L120 248 L116 361 Q116 381 104 381 L96 381 Q84 381 84 361 L80 248 L76 169 Q74 202 69 248 L58 248 Q49 197 51 151 Z" />
              <path d="M62 86 L40 180 Q38 196 48 198 Q58 198 60 184 L70 120" />
              <path d="M138 86 L160 180 Q162 196 152 198 Q142 198 140 184 L130 120" />
            </g>

            {projection.markers.map((marker) => {
              const style = STATUS[marker.status]
              const x = (marker.x / 100) * 200
              const y = (marker.y / 100) * 440
              const selected = marker.key === activeKey
              return (
                <g
                  key={marker.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${marker.label}: ${style.label}`}
                  className="cursor-pointer outline-none"
                  onClick={() => setActiveKey(marker.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setActiveKey(marker.key)
                    }
                  }}
                >
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={selected ? 10 : 7}
                    fill={style.ring}
                    initial={false}
                    animate={{ r: selected ? 10 : 7, opacity: selected ? 1 : 0.75 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
                  />
                  <circle cx={x} cy={y} r="4" fill={style.dot} stroke="#050708" strokeWidth="1.5" />
                </g>
              )
            })}
          </svg>

          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
            <div className="min-w-0 rounded-full border border-white/10 bg-black/65 px-3 py-2 backdrop-blur-xl">
              <div className="truncate text-[10px] font-black text-white/72">
                {active ? `${active.label} · ${STATUS[active.status].label}` : 'Tap a body marker'}
              </div>
            </div>
            <div className="shrink-0 rounded-full border border-white/10 bg-black/65 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white/42 backdrop-blur-xl">
              Reference silhouette
            </div>
          </div>
        </div>

        <aside className="order-3 space-y-3" aria-label="Body context governance">
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <div className="border-b border-white/10 pb-2">
              <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">Findings</div>
              <div className="mt-1 text-lg font-black">{projection.findingCounts.abnormal}</div>
            </div>
            <div className="border-b border-white/10 pb-2">
              <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">Recorded normal</div>
              <div className="mt-1 text-lg font-black">{projection.findingCounts.normal}</div>
            </div>
            <div className="border-b border-white/10 pb-2">
              <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">Not examined</div>
              <div className="mt-1 text-lg font-black">{projection.findingCounts.unchecked}</div>
            </div>
          </div>

          <details className="border-t border-white/10 pt-3 text-[11px] text-white/55">
            <summary className="cursor-pointer font-black text-white/70">Context boundary</summary>
            <p className="mt-2 leading-relaxed">
              Patient findings and vitals come from this AI-EMR context. The body silhouette is reference-only and is not patient-specific geometry. This bridge does not generate diagnosis, prognosis, treatment, lesion location or autonomous clinical action.
            </p>
          </details>

          {active?.note ? (
            <details className="border-t border-white/10 pt-3 text-[11px] text-white/55">
              <summary className="cursor-pointer truncate font-black text-white/70">{active.label} note</summary>
              <p className="mt-2 leading-relaxed">{active.note}</p>
            </details>
          ) : null}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[9px] font-black uppercase tracking-[.12em] text-white/30 sm:px-5">
        <span className="truncate">AI-EMR → shared clinical body overlay</span>
        <span className="truncate">patient signals ≠ atlas geometry</span>
      </footer>
    </section>
  )
}

export default ClinicalBodyTwin
