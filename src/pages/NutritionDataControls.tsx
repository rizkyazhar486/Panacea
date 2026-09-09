import { useMemo, useState, type ChangeEvent } from 'react'
import { useStore } from '../lib/store'
import {
  MAX_NUTRITION_IMPORT_BYTES,
  MAX_NUTRITION_IMPORT_ENTRIES,
  buildNutritionJournalTimeline,
  latestNutritionJournalSnapshot,
  parseNutritionJournalJson,
  sanitizeNutritionJournal,
  serializeNutritionJournal,
} from '../lib/nutritionJournal'

interface StatusMessage {
  kind: 'idle' | 'success' | 'error'
  text: string
}

function recordedEnergyPolyline(values: number[], width = 320, height = 96) {
  if (!values.length) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
    const y = span === 0 ? height / 2 : height - ((value - min) / span) * (height - 16) - 8
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export function NutritionDataControls() {
  const { state, addFood } = useStore()
  const [status, setStatus] = useState<StatusMessage>({
    kind: 'idle',
    text: 'Local journal controls are ready. No file is uploaded to Panacea.',
  })

  const journal = useMemo(
    () => sanitizeNutritionJournal(state.foods, 1_000),
    [state.foods],
  )
  const timeline = useMemo(() => buildNutritionJournalTimeline(state.foods, 7), [state.foods])
  const latest = useMemo(() => latestNutritionJournalSnapshot(state.foods), [state.foods])
  const energyPoints = useMemo(() => recordedEnergyPolyline(timeline.map((day) => day.kcal)), [timeline])

  function exportJournal() {
    const exported = serializeNutritionJournal(state.foods)
    const blob = new Blob([exported.json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'panacea-nutrition-journal.json'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setStatus({
      kind: 'success',
      text: `Exported ${exported.exported} validated record${exported.exported === 1 ? '' : 's'}${exported.rejected ? `; ${exported.rejected} malformed/overflow record${exported.rejected === 1 ? '' : 's'} were excluded` : ''}.`,
    })
  }

  async function importJournal(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_NUTRITION_IMPORT_BYTES) {
      setStatus({ kind: 'error', text: 'Import blocked: file exceeds the 1 MB local safety limit.' })
      return
    }

    try {
      const parsed = parseNutritionJournalJson(await file.text())
      const existingIds = new Set(state.foods.map((entry) => entry.id))
      const fresh = parsed.entries.filter((entry) => !existingIds.has(entry.id))
      for (const entry of [...fresh].reverse()) addFood(entry)
      const duplicateCount = parsed.entries.length - fresh.length
      setStatus({
        kind: 'success',
        text: `Imported ${fresh.length} validated record${fresh.length === 1 ? '' : 's'} locally. ${duplicateCount + parsed.rejected} duplicate/invalid/overflow record${duplicateCount + parsed.rejected === 1 ? '' : 's'} were skipped.`,
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        text: error instanceof Error ? `Import blocked: ${error.message}` : 'Import blocked: unreadable nutrition journal.',
      })
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">Nutrition journal · local data controls</div>
        <h3 className="mt-2 text-xl font-black text-ink dark:text-white">Portable without inventing data</h3>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Export or restore recorded food entries as a versioned JSON file. Import validation checks structure, dates, finite values, duplicate IDs and bounded record count. It does not verify that a food database or nutrient value is scientifically correct.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Saved records</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-white">{state.foods.length}</div>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Validated now</div>
            <div className="mt-1 text-2xl font-black text-emerald-600">{journal.entries.length}</div>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Rejected now</div>
            <div className="mt-1 text-2xl font-black text-amber-600">{journal.rejected}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={exportJournal} className="min-h-11 rounded-full bg-brand px-4 text-xs font-black text-white">
            Export validated JSON
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-neutral-300 px-4 text-xs font-black text-neutral-700 dark:border-white/15 dark:text-neutral-200">
            Import local JSON
            <input
              className="sr-only"
              type="file"
              accept=".json,application/json"
              aria-label="Import Panacea nutrition journal JSON"
              onChange={importJournal}
            />
          </label>
        </div>

        <div
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-2xl border p-3 text-[11px] leading-relaxed ${status.kind === 'error' ? 'border-red-300/50 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200' : status.kind === 'success' ? 'border-emerald-300/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-neutral-400'}`}
        >
          {status.text}
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Recorded-only snapshot + timeline</div>
        {!latest ? (
          <div className="mt-3 rounded-2xl border border-dashed border-neutral-300 p-5 text-center text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
            No valid nutrition journal records yet. This panel stays empty instead of generating a sample day.
          </div>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[9px] font-black uppercase text-neutral-400">Latest date</div><div className="mt-1 text-sm font-black text-ink dark:text-white">{latest.date}</div></div>
              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[9px] font-black uppercase text-neutral-400">Entries</div><div className="mt-1 text-lg font-black text-ink dark:text-white">{latest.entries}</div></div>
              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[9px] font-black uppercase text-neutral-400">Recorded kcal</div><div className="mt-1 text-lg font-black text-ink dark:text-white">{Math.round(latest.kcal)}</div></div>
              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[9px] font-black uppercase text-neutral-400">Recorded mass</div><div className="mt-1 text-lg font-black text-ink dark:text-white">{Math.round(latest.grams)} g</div></div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Recorded energy trend · latest {timeline.length} logged day{timeline.length === 1 ? '' : 's'}</div>
                {timeline.length < 2 ? (
                  <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">At least two recorded dates are required for a trend line. No missing day is inserted as zero.</p>
                ) : (
                  <svg viewBox="0 0 320 96" role="img" aria-label={`Recorded energy totals across ${timeline.length} logged days`} className="mt-3 h-28 w-full overflow-visible text-brand">
                    <polyline points={energyPoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {energyPoints.split(' ').map((point) => {
                      const [cx, cy] = point.split(',')
                      return <circle key={point} cx={cx} cy={cy} r="3.5" fill="currentColor" />
                    })}
                  </svg>
                )}
                <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">Descriptive journal totals only. The line is not a calorie target, energy-balance estimate or recommendation.</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Latest recorded dates</div>
                <div className="mt-2 space-y-2">
                  {[...timeline].reverse().map((day) => (
                    <div key={day.date} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-[10px] dark:bg-white/[0.03]">
                      <div><span className="font-black text-ink dark:text-white">{day.date}</span><span className="ml-2 text-neutral-400">{day.entries} entr{day.entries === 1 ? 'y' : 'ies'}</span></div>
                      <div className="text-right text-neutral-500">{Math.round(day.kcal)} kcal · C {Math.round(day.carbs)} g · P {Math.round(day.protein)} g · F {Math.round(day.fat)} g</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Offline + bounded import</div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Reading and writing happens in your browser. One import is limited to {MAX_NUTRITION_IMPORT_ENTRIES} records and 1 MB; unsupported schema versions, malformed JSON and invalid records fail closed.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-300/40 bg-amber-50/60 p-4 dark:border-amber-300/20 dark:bg-amber-400/[0.05]">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">Scientific boundary</div>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-100">
            A structurally valid journal is not proof that calories, macros, serving size or source-food identity are accurate. These controls preserve recorded values; they do not synthesize, correct or clinically interpret them.
          </p>
        </div>
      </section>
    </div>
  )
}

export default NutritionDataControls
