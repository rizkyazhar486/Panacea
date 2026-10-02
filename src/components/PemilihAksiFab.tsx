import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { KATALOG_AKSI } from '../lib/aksiFab'
import {
  DEFAULT_ASSISTIVE_PREFERENCES,
  loadAssistivePreferences,
  saveAssistivePreferences,
  type AssistiveGestureMap,
  type AssistivePreferences,
} from '../lib/interaction/assistive'

// Pemilih tindakan tombol melayang.
//
// DIPASANG DI BODY LEWAT PORTAL, dengan alasan yang sudah pernah menjatuhkan
// lembar lain di aplikasi ini: pembungkus beranda memakai container-type, dan
// elemen dengan container-type menjadi containing block bagi keturunan
// position: fixed. Lembar yang dirender di dalamnya tidak menutupi layar
// melainkan kotak induknya.

const GESTURE_ROWS: Array<{ key: keyof AssistiveGestureMap; label: string }> = [
  { key: 'singleTap', label: 'Single tap' },
  { key: 'doubleTap', label: 'Double tap' },
  { key: 'longPress', label: 'Long press' },
  { key: 'swipeUp', label: 'Swipe up' },
  { key: 'swipeDown', label: 'Swipe down' },
  { key: 'swipeLeft', label: 'Swipe left' },
  { key: 'swipeRight', label: 'Swipe right' },
]

function actionLabel(id: string): string {
  if (id === 'menu') return 'Open command menu'
  if (id === 'customize') return 'Customize Assistive Touch'
  return KATALOG_AKSI.find((action) => action.id === id)?.label ?? id
}

export function PemilihAksiFab({ tutup }: { tutup: () => void }) {
  const [prefs, setPrefs] = useState<AssistivePreferences>(loadAssistivePreferences)

  const gestureOptions = useMemo(() => [
    { id: 'menu', label: 'Open command menu' },
    { id: 'customize', label: 'Customize Assistive Touch' },
    ...KATALOG_AKSI.map((action) => ({ id: action.id, label: action.label })),
  ], [])

  useEffect(() => {
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') tutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [tutup])

  const commit = (next: AssistivePreferences) => {
    const saved = saveAssistivePreferences(next)
    setPrefs(saved)
  }

  const toggleAction = (id: string) => {
    const exists = prefs.menuActionIds.includes(id)
    if (exists && prefs.menuActionIds.length <= 4) return
    const nextIds = exists
      ? prefs.menuActionIds.filter((item) => item !== id)
      : [...prefs.menuActionIds, id].slice(-12)
    commit({ ...prefs, menuActionIds: nextIds })
  }

  const setGesture = (key: keyof AssistiveGestureMap, value: string) => {
    commit({ ...prefs, gestures: { ...prefs.gestures, [key]: value } })
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Customize Panacea Assistive Touch">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-neutral-900 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 p-4 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="text-[15px] font-black text-ink dark:text-white">Panacea Assistive Touch</h2>
            <p className="text-[11px] text-neutral-500">{prefs.menuActionIds.length} of 12 command slots used</p>
          </div>
          <button onClick={tutup} className="flex h-11 shrink-0 items-center rounded-full bg-neutral-100 px-4 text-[12px] font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:bg-white/10 dark:text-white">
            Done
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 sm:p-4">
          <section aria-labelledby="assistive-actions-heading">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 id="assistive-actions-heading" className="text-[12px] font-black uppercase tracking-[.12em] text-neutral-500">Command menu</h3>
              <span className="text-[10px] font-bold text-neutral-400">Minimum 4</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {KATALOG_AKSI.map((action) => {
                const active = prefs.menuActionIds.includes(action.id)
                const locked = active && prefs.menuActionIds.length <= 4
                return (
                  <button
                    key={action.id}
                    onClick={() => toggleAction(action.id)}
                    aria-pressed={active}
                    aria-disabled={locked || undefined}
                    className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      active ? 'border-brand bg-brand-50/60 dark:bg-brand/10' : 'border-neutral-200 dark:border-white/10'
                    } ${locked ? 'opacity-70' : ''}`}
                  >
                    <span aria-hidden className="text-[17px] leading-none">{action.ikon}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink dark:text-white">{action.label}</span>
                    <span className={`text-[13px] font-black ${active ? 'text-brand' : 'text-neutral-300 dark:text-neutral-600'}`} aria-hidden>
                      {active ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="assistive-gestures-heading">
            <h3 id="assistive-gestures-heading" className="mb-2 text-[12px] font-black uppercase tracking-[.12em] text-neutral-500">Gesture actions</h3>
            <div className="space-y-2">
              {GESTURE_ROWS.map(({ key, label }) => (
                <label key={key} className="grid min-h-[48px] grid-cols-[116px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-neutral-200 px-3 dark:border-white/10">
                  <span className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300">{label}</span>
                  <select
                    value={prefs.gestures[key]}
                    onChange={(event) => setGesture(key, event.target.value)}
                    aria-label={`${label} action`}
                    className="min-h-[40px] min-w-0 rounded-lg bg-transparent text-[12px] font-bold text-ink outline-none dark:text-white"
                  >
                    {gestureOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section aria-labelledby="assistive-behavior-heading" className="space-y-3">
            <h3 id="assistive-behavior-heading" className="text-[12px] font-black uppercase tracking-[.12em] text-neutral-500">Appearance & behavior</h3>
            <label className="block rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="mb-2 flex items-center justify-between text-[12px] font-bold text-ink dark:text-white">
                <span>Button size</span><span>{prefs.size}px</span>
              </div>
              <input className="w-full" type="range" min="56" max="76" step="2" value={prefs.size} onChange={(event) => commit({ ...prefs, size: Number(event.target.value) })} />
            </label>
            <label className="block rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="mb-2 flex items-center justify-between text-[12px] font-bold text-ink dark:text-white">
                <span>Idle opacity</span><span>{Math.round(prefs.idleOpacity * 100)}%</span>
              </div>
              <input className="w-full" type="range" min="0.42" max="1" step="0.04" value={prefs.idleOpacity} onChange={(event) => commit({ ...prefs, idleOpacity: Number(event.target.value) })} />
            </label>
            <label className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 dark:border-white/10">
              <span className="text-[12px] font-bold text-ink dark:text-white">Snap to nearest edge</span>
              <input type="checkbox" checked={prefs.snap} onChange={(event) => commit({ ...prefs, snap: event.target.checked })} />
            </label>
            <label className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 dark:border-white/10">
              <span className="text-[12px] font-bold text-ink dark:text-white">Haptic feedback</span>
              <input type="checkbox" checked={prefs.haptics} onChange={(event) => commit({ ...prefs, haptics: event.target.checked })} />
            </label>
          </section>

          <div className="rounded-xl bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-500 dark:bg-white/5">
            Current single tap: <strong>{actionLabel(prefs.gestures.singleTap)}</strong>. Assistive Touch never replaces normal navigation and stays disabled over the Body Explorer canvas.
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 p-3 dark:border-white/10">
          <button onClick={() => commit(DEFAULT_ASSISTIVE_PREFERENCES)} className="flex min-h-[44px] items-center rounded-full px-3 text-[12px] font-bold text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            Restore defaults
          </button>
          <span className="text-[10px] font-semibold text-neutral-400">Preferences stay on this device</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PemilihAksiFab
