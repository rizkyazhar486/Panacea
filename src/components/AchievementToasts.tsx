import { useEffect } from 'react'
import type { Achievement } from '../lib/achievements'
import '../styles/metal.css'

const BAR: Record<Achievement['tone'], string> = {
  red: '#e5342f',
  green: '#2fae4e',
  gold: '#caa33d',
  black: 'linear-gradient(180deg, #a78bfa, #4c3a8f)',
  prism: 'conic-gradient(from 200deg, #ff5f6d, #ffc371, #f9f871, #6bffb8, #6bd7ff, #a86bff, #ff5f6d)',
}
const LABEL: Record<Achievement['tone'], string> = { red: 'Blood & Oxygen', green: 'Nature', gold: 'Wealth', black: 'Out of the Dark', prism: 'The Rarest Air' }
const TAG_CLASS: Record<Achievement['tone'], string> = { red: 'metal-gold', green: 'metal-gold', gold: 'metal-gold', black: 'metal-gold', prism: 'metal-prism' }

function Toast({ a, onDone }: { a: Achievement; onDone: () => void }) {
  // Auto-dismiss — a popup that never leaves is a notification, not a
  // moment. 4.2s is long enough to read a two-line achievement.
  useEffect(() => {
    const t = setTimeout(onDone, 4200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="metal-forge pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl px-4 py-3 shadow-2xl">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: BAR[a.tone] }} />
      <div className="relative pl-3">
        <div className="flex items-center gap-2">
          <span className={`metal-tag ${TAG_CLASS[a.tone]}`}>Unlocked</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-white/50">{LABEL[a.tone]}</span>
        </div>
        <div className={`metal-display mt-1 text-sm ${a.tone === 'prism' ? 'metal-emboss-prism' : 'text-white'}`}>{a.title}</div>
        <div className="text-xs text-white/70">{a.desc}</div>
      </div>
    </div>
  )
}

export function AchievementToasts({ toasts, onDismiss }: { toasts: Achievement[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((a) => <Toast key={a.id} a={a} onDone={() => onDismiss(a.id)} />)}
    </div>
  )
}
