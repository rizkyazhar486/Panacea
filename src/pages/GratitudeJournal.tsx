import { useEffect, useState } from 'react'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Gratitude Journal — "Three Good Things" (Seligman et al., 2005, Am Psychol
// 60(5):410-421): writing three things that went well each day, and why, is
// one of the most replicated positive-psychology interventions — it lifts mood
// and lowers depressive symptoms for months. Pure localStorage, no API.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_gratitude_v1'
interface Entry { date: string; items: string[] }

function load(): Entry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') as Entry[] } catch { return [] }
}
function streakOf(entries: Entry[]): number {
  const dates = new Set(entries.map((e) => e.date))
  let s = 0
  const d = new Date()
  // count back from today (or yesterday if today not done yet)
  if (!dates.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
  while (dates.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1) }
  return s
}

export function GratitudeJournal() {
  const today = new Date().toISOString().slice(0, 10)
  const [entries, setEntries] = useState<Entry[]>(load)
  const todayEntry = entries.find((e) => e.date === today)
  const [items, setItems] = useState<string[]>(todayEntry?.items ?? ['', '', ''])

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(entries)) } catch { /* ignore */ }
  }, [entries])

  const save = () => {
    const clean = items.map((s) => s.trim())
    if (clean.every((s) => !s)) return
    setEntries((prev) => {
      const rest = prev.filter((e) => e.date !== today)
      return [{ date: today, items: clean }, ...rest].sort((a, b) => b.date.localeCompare(a.date))
    })
  }

  const streak = streakOf(entries)
  const past = entries.filter((e) => e.date !== today).slice(0, 14)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Gratitude Journal" subtitle='"Three Good Things" — a proven mood-lifting daily habit' />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Each evening, write three things that went well today and — briefly — why. It sounds simple,
          but it's one of the most replicated ways to raise happiness and lower depressive symptoms
          over weeks to months.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Today · {today}</div>
          <Badge tone={streak > 0 ? 'brand' : 'low'}>🔥 {streak} day{streak === 1 ? '' : 's'}</Badge>
        </div>
        <div className="mt-3 space-y-2">
          {items.map((v, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 w-5 shrink-0 text-center font-black text-brand-dark">{i + 1}</span>
              <textarea
                className={`${inputClass} min-h-[52px] resize-none`}
                placeholder={['Something good that happened…', 'A person or moment you appreciated…', 'Something you did well…'][i]}
                value={v}
                onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
              />
            </div>
          ))}
        </div>
        <button onClick={save} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">
          {todayEntry ? 'Update today’s entry' : 'Save today’s three good things'}
        </button>
      </Card>

      {past.length > 0 && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Looking back</div>
          <div className="mt-3 space-y-3">
            {past.map((e) => (
              <div key={e.date} className="rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
                <div className="text-[11px] font-bold text-neutral-400">{e.date}</div>
                <ul className="mt-1 list-inside list-disc text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {e.items.filter(Boolean).map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Seligman, M.E.P., et al. (2005). Positive psychology progress: empirical validation of
        interventions. <i>American Psychologist</i>, 60(5), 410-421. Entries are saved only on this
        device. A wellbeing practice — not a substitute for care if you're struggling.
      </div>
    </div>
  )
}

export default GratitudeJournal
