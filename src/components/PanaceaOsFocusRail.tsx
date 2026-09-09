import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Card } from './ui'
import {
  PANACEA_OS_CATEGORIES,
  panaceaOsStorageKey,
  readPanaceaOsItems,
  resolvePanaceaOsFocus,
  sortPanaceaOsItems,
  type PanaceaOsCategory,
  type PanaceaOsItem,
} from '../lib/panaceaOsFocus'

const LABELS: Record<PanaceaOsCategory, string> = {
  work: 'Work', study: 'Study', appointment: 'Appointment', health: 'Health', training: 'Training',
  nutrition: 'Meal / Nutrition', family: 'Family', social: 'Social', finance: 'Finance', spiritual: 'Spiritual',
  recovery: 'Recovery', leisure: 'Leisure', admin: 'Admin',
}

function minutesNow() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `os-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function PanaceaOsFocusRail({ date }: { date: string }) {
  const [items, setItems] = useState<PanaceaOsItem[]>([])
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [category, setCategory] = useState<PanaceaOsCategory>('work')
  const [clock, setClock] = useState(minutesNow)

  useEffect(() => {
    try { setItems(readPanaceaOsItems(localStorage.getItem(panaceaOsStorageKey(date)), date)) }
    catch { setItems([]) }
  }, [date])

  useEffect(() => {
    const id = window.setInterval(() => setClock(minutesNow()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const focus = useMemo(() => resolvePanaceaOsFocus(items, clock), [items, clock])
  const completed = items.filter((item) => item.completedAt).length

  function persist(next: PanaceaOsItem[]) {
    const ordered = sortPanaceaOsItems(next)
    setItems(ordered)
    try { localStorage.setItem(panaceaOsStorageKey(date), JSON.stringify(ordered)) } catch { /* memory fallback */ }
  }

  function addItem(event: FormEvent) {
    event.preventDefault()
    const clean = title.trim()
    if (!clean) return
    persist([...items, { id: makeId(), date, title: clean, category, time: time || undefined, createdAt: new Date().toISOString() }])
    setTitle('')
  }

  function toggle(id: string) {
    const now = new Date().toISOString()
    persist(items.map((item) => item.id === id ? { ...item, completedAt: item.completedAt ? undefined : now } : item))
  }

  return (
    <div data-panacea-os-focus="v1">
      <Card className="!p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">Panacea OS · Daily focus</span>
            <h2 className="mt-0.5 text-[16px] font-black text-ink dark:text-white">Now → Next → Later</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">Explicit agenda only — no diagnosis, readiness score, or hidden clinical inference.</p>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{completed}/{items.length} done</span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Daily focus sequence">
          {(['Now', 'Next', 'Later'] as const).map((slot, index) => {
            const entry = focus[index]
            return (
              <div key={slot} className="min-h-[104px] rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">{slot}</span>
                  {entry?.item.time && <span className="text-[10px] font-black tabular-nums text-neutral-500">{entry.item.time}</span>}
                </div>
                {entry ? (
                  <>
                    <p className="mt-2 text-[13px] font-black text-ink dark:text-white">{entry.item.title}</p>
                    <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[9.5px] font-bold text-neutral-500 dark:bg-white/10">{LABELS[entry.item.category]}</span>
                  </>
                ) : <p className="mt-2 text-[11px] text-neutral-400">Nothing queued.</p>}
              </div>
            )
          })}
        </div>

        <form onSubmit={addItem} className="mt-3 grid gap-2 rounded-2xl bg-neutral-50 p-2.5 dark:bg-white/[0.04] sm:grid-cols-[92px_130px_1fr_auto]">
          <label className="sr-only" htmlFor="panacea-os-time">Time</label>
          <input id="panacea-os-time" aria-label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-h-[42px] rounded-xl border border-neutral-200 bg-white px-2 text-[12px] dark:border-white/15 dark:bg-white/10" />
          <label className="sr-only" htmlFor="panacea-os-category">Category</label>
          <select id="panacea-os-category" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as PanaceaOsCategory)} className="min-h-[42px] rounded-xl border border-neutral-200 bg-white px-2 text-[12px] dark:border-white/15 dark:bg-white/10">
            {PANACEA_OS_CATEGORIES.map((value) => <option key={value} value={value}>{LABELS[value]}</option>)}
          </select>
          <label className="sr-only" htmlFor="panacea-os-title">Agenda item</label>
          <input id="panacea-os-title" aria-label="Agenda item" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="One concrete thing to do" className="min-h-[42px] min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-[12px] dark:border-white/15 dark:bg-white/10" />
          <button type="submit" disabled={!title.trim()} className="min-h-[42px] rounded-xl bg-brand px-4 text-[12px] font-black text-white disabled:opacity-40">Add</button>
        </form>

        {items.length > 0 && <div className="mt-3 space-y-1.5" aria-label="Daily agenda">{items.map((item) => (
          <div key={item.id} className="flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-100 px-2.5 py-2 dark:border-white/10">
            <button type="button" onClick={() => toggle(item.id)} aria-label={`${item.completedAt ? 'Reopen' : 'Complete'} ${item.title}`} aria-pressed={Boolean(item.completedAt)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-neutral-300 text-[12px] font-black dark:border-white/20">✓</button>
            <span className={`min-w-0 flex-1 truncate text-[12px] font-bold ${item.completedAt ? 'text-neutral-400 line-through' : 'text-ink dark:text-white'}`}>{item.title}</span>
          </div>
        ))}</div>}
      </Card>
    </div>
  )
}
