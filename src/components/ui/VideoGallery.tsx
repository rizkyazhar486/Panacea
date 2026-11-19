import { useState } from 'react'
import { Card, SectionTitle } from '../ui'

export interface GalleryVideo { label: string; cue: string; url: string }

function classifyMotionKind(label: string): 'bp' | 'breath' | 'stretch' | 'cardio' {
  const s = label.toLowerCase()
  if (s.includes('blood pressure') || s.includes('tensi')) return 'bp'
  if (s.includes('breath') || s.includes('medit') || s.includes('napas')) return 'breath'
  if (s.includes('stretch') || s.includes('hamstring') || s.includes('twist')) return 'stretch'
  return 'cardio'
}

/** Realistic vector telemetry & biomechanical posture schematic replacing uncanny AI video loops. */
function MotionSchematic({ label }: { readonly label: string }) {
  const kind = classifyMotionKind(label)
  return (
    <div className="astro-horizon-grid relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden bg-[#040911] p-3.5 text-white">
      <div className="flex items-center justify-between gap-2">
        <span className="font-astro text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
          {kind === 'bp' ? 'HEMODYNAMIC PROTOCOL' : kind === 'breath' ? 'AUTONOMIC CADENCE 4·7·8' : kind === 'stretch' ? 'MYOFASCIAL ROM VECTOR' : 'KINEMATIC FORM GUIDE'}
        </span>
        <span className="font-astro-mono rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          VECTOR MODEL
        </span>
      </div>

      <svg viewBox="0 0 280 96" className="my-1 h-24 w-full" role="img" aria-label={`${label} biomechanical diagram`}>
        <defs>
          <linearGradient id={`ng-${kind}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#c6ff34" />
          </linearGradient>
        </defs>
        <line x1="12" y1="82" x2="268" y2="82" stroke="rgba(148,163,184,0.22)" strokeWidth="1" />
        {kind === 'bp' && (
          <>
            <path d="M16 58 L64 58 L76 58 L84 22 L92 70 L102 48 L120 58 L168 58 L176 22 L184 70 L194 48 L214 58 L264 58" fill="none" stroke={`url(#ng-${kind})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="84" cy="22" r="3.5" fill="#22d3ee" />
            <circle cx="176" cy="22" r="3.5" fill="#10b981" />
            <text x="16" y="18" fill="#94a3b8" fontSize="9" fontFamily="monospace">CUFF AT HEART LEVEL · 5 MIN REST · FEET FLAT</text>
          </>
        )}
        {kind === 'breath' && (
          <>
            <path d="M16 74 C44 74, 58 22, 86 22 L176 22 C204 22, 224 74, 264 74" fill="none" stroke={`url(#ng-${kind})`} strokeWidth="2.6" strokeLinecap="round" />
            <line x1="86" y1="16" x2="86" y2="80" stroke="rgba(34,211,238,0.35)" strokeDasharray="3 3" />
            <line x1="176" y1="16" x2="176" y2="80" stroke="rgba(16,185,129,0.35)" strokeDasharray="3 3" />
            <text x="26" y="15" fill="#67e8f9" fontSize="9" fontFamily="monospace">INHALE 4s</text>
            <text x="114" y="15" fill="#6ee7b7" fontSize="9" fontFamily="monospace">HOLD 7s</text>
            <text x="196" y="15" fill="#d9f99d" fontSize="9" fontFamily="monospace">EXHALE 8s</text>
          </>
        )}
        {kind === 'stretch' && (
          <>
            <path d="M36 76 L112 76 L184 30" fill="none" stroke={`url(#ng-${kind})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M138 76 A26 26 0 0 0 132 61" fill="none" stroke="#c6ff34" strokeWidth="1.8" />
            <circle cx="112" cy="76" r="5" fill="#22d3ee" />
            <circle cx="184" cy="30" r="4" fill="#10b981" />
            <text x="148" y="72" fill="#d9f99d" fontSize="9" fontFamily="monospace">20-30s / SIDE · PAIN-FREE ARC</text>
          </>
        )}
        {kind === 'cardio' && (
          <>
            <path d="M24 76 L72 44 L118 76 L166 24 L214 76 L256 48" fill="none" stroke={`url(#ng-${kind})`} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="72" cy="44" r="4" fill="#22d3ee" />
            <circle cx="166" cy="24" r="4.5" fill="#10b981" />
            <circle cx="256" cy="48" r="4" fill="#c6ff34" />
            <text x="24" y="16" fill="#94a3b8" fontSize="9" fontFamily="monospace">NEUTRAL SPINE · 90° KNEE TRACKING · CONTROLLED TEMPO</text>
          </>
        )}
      </svg>

      <div className="flex items-center justify-between text-[10px] text-slate-300">
        <span className="font-astro-mono">SIMULATED MOTION REFERENCE</span>
        <span className="text-emerald-300">NO SYNTHETIC LOOP</span>
      </div>
    </div>
  )
}

/**
 * Realistic clinical & biomechanical motion guide.
 * Replaces forced auto-playing synthetic AI loops with clean high-precision vector schematics
 * and an explicit opt-in user-controlled reference clip toggle.
 */
export function VideoGallery({ title, subtitle, icon, videos }: {
  title: string
  subtitle: string
  icon?: React.ReactNode
  videos: GalleryVideo[]
}) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [failedIdx, setFailedIdx] = useState<Record<number, boolean>>({})

  if (videos.length === 0) return null
  return (
    <Card className="!p-5">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      <div className={'mt-3 grid grid-cols-1 gap-3 ' + (videos.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {videos.map((v, i) => {
          const showClip = playingIdx === i && !failedIdx[i] && Boolean(v.url)
          return (
            <div key={v.label} className="astro-surface overflow-hidden rounded-2xl text-white">
              {showClip ? (
                <video
                  src={v.url}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setFailedIdx((prev) => ({ ...prev, [i]: true }))}
                  className="aspect-[16/10] w-full bg-[#040911] object-cover"
                />
              ) : (
                <MotionSchematic label={v.label} />
              )}
              <div className="space-y-2 p-3">
                <div className="font-astro text-xs font-extrabold text-white">{v.label}</div>
                <div className="text-[11px] leading-relaxed text-slate-300">{v.cue}</div>
                {v.url && !failedIdx[i] && (
                  <button
                    type="button"
                    onClick={() => setPlayingIdx(showClip ? null : i)}
                    className="astro-chip inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 text-[11px] font-bold"
                  >
                    {showClip ? 'Return to schematic diagram' : 'Open optional reference clip'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
