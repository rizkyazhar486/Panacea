// Modern visual body map for the physical examination — an anatomical silhouette
// with per-system markers. Findings remain editable as text; this is the visual
// summary layer that makes the exam "modern dengan gambar".

import { useState } from 'react'

export interface SystemFinding {
  key: string
  label: string
  x: number // % position on the 0..200 / 0..440 viewBox
  y: number
  status: 'normal' | 'abnormal' | 'unchecked'
  note?: string
}

const STATUS = {
  normal: { ring: '#00BF63', fill: '#00BF63' },
  abnormal: { ring: '#FF3131', fill: '#FF3131' },
  unchecked: { ring: '#cbd5d1', fill: '#ffffff' },
}

export function BodyDiagram({
  findings,
  onToggle,
}: {
  findings: SystemFinding[]
  onToggle?: (key: string) => void
}) {
  const [active, setActive] = useState<string | null>(null)
  const sel = findings.find((f) => f.key === active)

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div className="relative mx-auto">
        <svg viewBox="0 0 200 440" className="h-[300px] w-auto">
          {/* silhouette */}
          <g fill="#eef4f0" stroke="#d6e4dc" strokeWidth="1.5">
            <circle cx="100" cy="40" r="26" />
            <rect x="86" y="64" width="28" height="16" rx="6" />
            <path d="M62 84 Q100 74 138 84 L150 150 Q152 200 142 250 L132 250 Q126 200 124 170 L120 250 L116 360 Q116 380 104 380 L96 380 Q84 380 84 360 L80 250 L76 170 Q74 200 68 250 L58 250 Q48 200 50 150 Z" />
            <path d="M62 86 L40 180 Q38 196 48 198 Q58 198 60 184 L70 120" />
            <path d="M138 86 L160 180 Q162 196 152 198 Q142 198 140 184 L130 120" />
          </g>
          {/* markers */}
          {findings.map((f) => {
            const st = STATUS[f.status]
            const isActive = active === f.key
            return (
              <g
                key={f.key}
                className="cursor-pointer"
                onClick={() => {
                  setActive(f.key)
                  onToggle?.(f.key)
                }}
              >
                <circle
                  cx={(f.x / 100) * 200}
                  cy={(f.y / 100) * 440}
                  r={isActive ? 8 : 6}
                  fill={st.fill}
                  stroke="#fff"
                  strokeWidth="2"
                  opacity={f.status === 'unchecked' ? 0.6 : 1}
                />
                {isActive && (
                  <circle cx={(f.x / 100) * 200} cy={(f.y / 100) * 440} r="12" fill="none" stroke={st.ring} strokeWidth="1.5" opacity="0.5" />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-1.5">
          {findings.map((f) => {
            const st = STATUS[f.status]
            return (
              <button
                key={f.key}
                onClick={() => {
                  setActive(f.key)
                  onToggle?.(f.key)
                }}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition ${
                  active === f.key ? 'border-brand bg-brand-50' : 'border-neutral-100 hover:bg-neutral-50'
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: st.fill, opacity: f.status === 'unchecked' ? 0.5 : 1 }} />
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm">
          {sel ? (
            <>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-bold">{sel.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: STATUS[sel.status].fill }}
                >
                  {sel.status === 'normal' ? 'Normal' : sel.status === 'abnormal' ? 'Temuan (+)' : 'Belum diperiksa'}
                </span>
              </div>
              <p className="text-neutral-600">{sel.note || 'Belum ada catatan untuk sistem ini.'}</p>
            </>
          ) : (
            <p className="text-neutral-400">Pilih sistem pada gambar untuk melihat temuan.</p>
          )}
        </div>

        <div className="mt-2 flex gap-3 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand" /> Normal</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Abnormal</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-neutral-300" /> Belum diperiksa</span>
        </div>
      </div>
    </div>
  )
}
