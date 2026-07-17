import { useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconChartUp, IconActivity } from '../components/icons'
import { analyzeCsv, type AnalysisResult, type ColumnStats } from '../lib/dataAnalyzer'

// ─────────────────────────────────────────────────────────────────────────────
// Data Lab — upload a raw CSV export from any wearable, CGM, smart scale, or BP
// cuff and Panaceamed processes it ("mengolah data") into human-meaningful
// conclusions: glucose time-in-range & estimated HbA1c, resting-HR & HRV trends,
// sleep adequacy, SpO₂ dips, blood-pressure averages, step targets. This is how
// raw hardware numbers become something a person can actually act on. Fully
// on-device — the file never leaves the browser.
// ─────────────────────────────────────────────────────────────────────────────

const TONE_META: Record<ColumnStats['tone'], { label: string; badge: 'brand' | 'low' | 'critical' | 'neutral'; color: string }> = {
  good: { label: 'Looking good', badge: 'brand', color: '#00BF63' },
  watch: { label: 'Worth watching', badge: 'low', color: '#f59e0b' },
  alert: { label: 'Needs attention', badge: 'critical', color: '#ef4444' },
  neutral: { label: 'Info', badge: 'neutral', color: '#94a3b8' },
}

const MAX_BYTES = 25 * 1024 * 1024

export function DataLab() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [err, setErr] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(file?: File) {
    if (!file) return
    setErr(''); setResult(null)
    if (file.size > MAX_BYTES) { setErr(`File too large (${(file.size / 1048576).toFixed(0)} MB, max 25 MB).`); return }
    setFileName(file.name)
    try {
      const text = await file.text()
      const r = analyzeCsv(text)
      if (!r.columns.length) { setErr(r.headline); return }
      setResult(r)
    } catch { setErr('Could not read that file. Make sure it is a CSV export.') }
    finally { if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Data Lab" subtitle="Upload a wearable / CGM / scale / BP export — get it turned into plain conclusions" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Export a CSV from your device or health app (glucose monitor, watch, smart scale, blood-pressure cuff) and drop it here. Panaceamed recognizes the columns and processes them into what they actually mean for you — nothing leaves your device.
        </p>
        <button onClick={() => fileRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-50 py-8 text-sm font-bold text-brand-dark dark:bg-white/5">
          📄 {fileName ? `Re-upload (last: ${fileName})` : 'Choose a CSV file'}
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>}
        <p className="mt-3 text-[11px] text-neutral-400">Recognized automatically: glucose, heart rate, HRV, steps, sleep, SpO₂, weight, systolic/diastolic BP. Other numeric columns get a basic summary.</p>
      </Card>

      {result && (
        <>
          <Card className="!p-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Summary</div>
            <p className="mt-1 text-sm font-semibold text-ink dark:text-white">{result.headline}</p>
          </Card>

          {result.columns.map((c) => (
            <Card key={c.key} className="!p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-ink dark:text-white">{c.label}</h3>
                    {c.unit && <span className="text-xs text-neutral-400">{c.unit}</span>}
                  </div>
                  {c.metric === 'generic' && <div className="text-[11px] text-neutral-400">Column: {c.key}</div>}
                </div>
                <Badge tone={TONE_META[c.tone].badge}>{TONE_META[c.tone].label}</Badge>
              </div>

              {/* stat row */}
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Stat label="Avg" value={fmt(c.mean)} />
                <Stat label="Min" value={fmt(c.min)} />
                <Stat label="Max" value={fmt(c.max)} />
                <Stat label="Trend" value={`${c.trend >= 0 ? '+' : ''}${c.trend.toFixed(0)}%`} color={Math.abs(c.trend) < 3 ? undefined : c.trend > 0 ? '#f59e0b' : '#00BF63'} />
              </div>

              {/* conclusions */}
              <div className="mt-3 rounded-xl p-3" style={{ background: TONE_META[c.tone].color + '14' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">What this means</div>
                <ul className="mt-1 space-y-1">
                  {c.conclusions.map((t, i) => <li key={i} className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">• {t}</li>)}
                </ul>
              </div>
              <div className="mt-1.5 text-[10px] text-neutral-400">n = {c.n.toLocaleString()} readings</div>
            </Card>
          ))}
        </>
      )}

      {!result && !err && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="What you'll get" />
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            <li><b>Glucose (CGM):</b> time-in-range, estimated HbA1c, variability, high/low flags.</li>
            <li><b>Heart rate / HRV:</b> resting estimate, averages, recovery trend.</li>
            <li><b>Sleep &amp; steps:</b> adequacy vs targets.</li>
            <li><b>SpO₂:</b> average &amp; low-oxygen dip detection.</li>
            <li><b>Blood pressure &amp; weight:</b> averages and direction of change.</li>
          </ul>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational data processing — conclusions use standard thresholds (e.g. CGM time-in-range 70–180, adult sleep 7–9h) and are not a diagnosis. Your file is parsed entirely in the browser and never uploaded. Review anything concerning with a clinician.
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5">
      <div className="text-sm font-black" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
    </div>
  )
}
function fmt(n: number): string { return Math.abs(n) >= 1000 ? Math.round(n).toLocaleString() : (Math.round(n * 10) / 10).toString() }

export default DataLab
