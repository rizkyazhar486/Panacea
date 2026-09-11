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

const CATEGORY_LABELS: Record<PanaceaOsCategory, string> = {
  work: 'Work', study: 'Study', appointment: 'Appointment', health: 'Health', training: 'Training',
  nutrition: 'Meal / Nutrition', family: 'Family', social: 'Social', finance: 'Finance', spiritual: 'Spiritual',
  recovery: 'Recovery', leisure: 'Leisure', admin: 'Admin',
}

function clockMinutesNow() { const now = new Date(); return now.getHours() * 60 + now.getMinutes() }
function makeId() { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `os-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
function timingCopy(timing: ReturnType<typeof resolvePanaceaOsFocus>[number]['timing'], delta?: number) {
  if (timing === 'open') return 'No fixed time'
  if (timing === 'overdue') return delta === undefined ? 'Past due' : `${Math.abs(delta)} min past`
  if (timing === 'soon') return delta === undefined || Math.abs(delta) <= 1 ? 'Around now' : delta < 0 ? `${Math.abs(delta)} min past` : `in ${delta} min`
  if (delta === undefined) return 'Scheduled'
  const hours = Math.floor(delta / 60), minutes = delta % 60
  return hours > 0 ? `in ${hours}h${minutes ? ` ${minutes}m` : ''}` : `in ${minutes} min`
}

export function PanaceaOsFocusRail({ date }: { date: string }) {
  const [items, setItems] = useState<PanaceaOsItem[]>([])
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [category, setCategory] = useState<PanaceaOsCategory>('work')
  const [minutesNow, setMinutesNow] = useState(clockMinutesNow)

  useEffect(() => { try { setItems(readPanaceaOsItems(localStorage.getItem(panaceaOsStorageKey(date)), date)) } catch { setItems([]) } }, [date])
  useEffect(() => { const id = window.setInterval(() => setMinutesNow(clockMinutesNow()), 60_000); return () => window.clearInterval(id) }, [])

  const focus = useMemo(() => resolvePanaceaOsFocus(items, minutesNow), [items, minutesNow])
  const completed = items.filter((item) => item.completedAt).length
  function persist(next: PanaceaOsItem[]) { const ordered = sortPanaceaOsItems(next); setItems(ordered); try { localStorage.setItem(panaceaOsStorageKey(date), JSON.stringify(ordered)) } catch {} }
  function addItem(event: FormEvent) { event.preventDefault(); const clean = title.trim(); if (!clean) return; persist([...items, { id: makeId(), date, title: clean, category, time: time || undefined, createdAt: new Date().toISOString() }]); setTitle('') }
  function toggleItem(id: string) { const now = new Date().toISOString(); persist(items.map((item) => item.id === id ? { ...item, completedAt: item.completedAt ? undefined : now } : item)) }
  function removeItem(id: string) { persist(items.filter((item) => item.id !== id)) }

  return <Card className="!p-3">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">Panacea OS · Daily focus</span><h2 className="mt-0.5 text-[16px] font-black text-ink dark:text-white">Now → Next → Later</h2><p className="mt-0.5 max-w-xl text-[11px] leading-snug text-neutral-500">Your explicit agenda only. No readiness score, diagnosis, or hidden AI inference is created here.</p></div><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold tabular-nums text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{completed}/{items.length} done</span></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Daily focus sequence">{(['Now','Next','Later'] as const).map((slot,index)=>{const entry=focus[index];return <div key={slot} className={`min-h-[104px] rounded-2xl border p-3 ${index===0?'border-brand/35 bg-brand/[0.06]':'border-neutral-200 bg-black/[0.015] dark:border-white/10 dark:bg-white/[0.03]'}`}><div className="flex items-center justify-between gap-2"><span className={`text-[10px] font-black uppercase tracking-[0.14em] ${index===0?'text-brand':'text-neutral-500'}`}>{slot}</span>{entry?.item.time&&<span className="text-[10px] font-black tabular-nums text-neutral-500">{entry.item.time}</span>}</div>{entry?<><p className="mt-2 text-[13px] font-black leading-snug text-ink dark:text-white">{entry.item.title}</p><div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9.5px] font-bold text-neutral-500"><span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-white/10">{CATEGORY_LABELS[entry.item.category]}</span><span>{timingCopy(entry.timing,entry.minutesFromNow)}</span></div></>:<p className="mt-2 text-[11px] leading-snug text-neutral-400">Nothing queued.</p>}</div>})}</div>
    <form onSubmit={addItem} className="mt-3 grid gap-2 rounded-2xl bg-neutral-50 p-2.5 dark:bg-white/[0.04] sm:grid-cols-[92px_130px_1fr_auto]"><label className="sr-only" htmlFor="panacea-os-time">Time</label><input id="panacea-os-time" type="time" value={time} onChange={(e)=>setTime(e.target.value)} className="min-h-[42px] rounded-xl border border-neutral-200 bg-white px-2 text-[12px] font-bold text-ink dark:border-white/15 dark:bg-white/10 dark:text-white"/><label className="sr-only" htmlFor="panacea-os-category">Category</label><select id="panacea-os-category" value={category} onChange={(e)=>setCategory(e.target.value as PanaceaOsCategory)} className="min-h-[42px] rounded-xl border border-neutral-200 bg-white px-2 text-[12px] font-bold text-ink dark:border-white/15 dark:bg-white/10 dark:text-white">{PANACEA_OS_CATEGORIES.map((value)=><option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select><label className="sr-only" htmlFor="panacea-os-title">Agenda item</label><input id="panacea-os-title" value={title} maxLength={120} onChange={(e)=>setTitle(e.target.value)} placeholder="One concrete thing to do" className="min-h-[42px] min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-[12px] font-semibold text-ink dark:border-white/15 dark:bg-white/10 dark:text-white"/><button type="submit" disabled={!title.trim()} className="min-h-[42px] rounded-xl bg-brand px-4 text-[12px] font-black text-white disabled:opacity-40">Add</button></form>
    {items.length>0&&<div className="mt-3 space-y-1.5" aria-label="Daily agenda">{items.map((item)=><div key={item.id} className="flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-100 px-2.5 py-2 dark:border-white/10"><button type="button" onClick={()=>toggleItem(item.id)} aria-label={`${item.completedAt?'Reopen':'Complete'} ${item.title}`} aria-pressed={Boolean(item.completedAt)} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px] font-black ${item.completedAt?'border-brand bg-brand text-white':'border-neutral-300 text-transparent dark:border-white/20'}`}>✓</button><div className="min-w-0 flex-1"><div className="flex min-w-0 items-baseline gap-2">{item.time&&<span className="shrink-0 text-[10px] font-black tabular-nums text-neutral-500">{item.time}</span>}<span className={`min-w-0 truncate text-[12px] font-bold ${item.completedAt?'text-neutral-400 line-through':'text-ink dark:text-white'}`}>{item.title}</span></div><span className="text-[9.5px] font-semibold text-neutral-400">{CATEGORY_LABELS[item.category]}</span></div><button type="button" onClick={()=>removeItem(item.id)} aria-label={`Delete ${item.title}`} className="min-h-[36px] shrink-0 rounded-lg px-2 text-[10px] font-bold text-neutral-400">Delete</button></div>)}</div>}
  </Card>
}
