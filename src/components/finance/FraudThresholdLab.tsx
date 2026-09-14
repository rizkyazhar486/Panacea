import { useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../ui'
import { IconChartUp } from '../icons'
import {
  csvHeaders,
  inferFraudColumns,
  metricsAtThreshold,
  parseFraudCsv,
  summarizeFraudRows,
  type FraudObservation,
} from '../../lib/finance/fraudThresholdLab'

const MAX_BYTES = 25 * 1024 * 1024

function pct(value: number | null): string {
  return value == null ? '—' : `${(value * 100).toFixed(1)}%`
}

export function FraudThresholdLab() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [text, setText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [labelColumn, setLabelColumn] = useState('')
  const [scoreColumn, setScoreColumn] = useState('')
  const [threshold, setThreshold] = useState(0.5)
  const [error, setError] = useState('')

  const parsed = useMemo(() => {
    if (!text || !labelColumn || !scoreColumn) return null
    return parseFraudCsv(text, labelColumn, scoreColumn)
  }, [text, labelColumn, scoreColumn])

  const rows: FraudObservation[] = parsed?.rows ?? []
  const summary = useMemo(() => summarizeFraudRows(rows), [rows])
  const metrics = useMemo(() => metricsAtThreshold(rows, threshold), [rows, threshold])

  async function openFile(file?: File) {
    if (!file) return
    setError('')
    if (file.size > MAX_BYTES) {
      setError(`File too large (${(file.size / 1048576).toFixed(0)} MB, max 25 MB).`)
      return
    }
    try {
      const nextText = await file.text()
      const nextHeaders = csvHeaders(nextText)
      if (nextHeaders.length < 2) {
        setError('CSV needs a header row and at least two columns.')
        return
      }
      const inferred = inferFraudColumns(nextHeaders)
      setFileName(file.name)
      setText(nextText)
      setHeaders(nextHeaders)
      setLabelColumn(inferred.label ?? nextHeaders[0])
      setScoreColumn(inferred.score ?? nextHeaders.find((h) => h !== (inferred.label ?? nextHeaders[0])) ?? '')
    } catch {
      setError('Could not read that CSV file.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconChartUp size={20} />}
          title="Fraud threshold lab"
          subtitle="Precision–recall trade-offs for highly imbalanced scored transactions"
        />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Upload a CSV that already contains a true binary label (0/1) and a model score between 0 and 1. Panacea does not train a model here. It evaluates the threshold you choose entirely in your browser.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 min-h-11 w-full rounded-2xl border-2 border-dashed border-brand/40 bg-brand-50 px-4 py-4 text-sm font-bold text-brand-dark dark:bg-white/5"
        >
          {fileName ? `Choose another CSV · ${fileName}` : 'Choose scored-transactions CSV'}
        </button>
        <input ref={inputRef} className="hidden" type="file" accept=".csv,text/csv,text/plain" onChange={(event) => openFile(event.target.files?.[0])} />
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
      </Card>

      {headers.length > 0 && (
        <Card className="!p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              True label column
              <select value={labelColumn} onChange={(e) => setLabelColumn(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-neutral-900">
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              Fraud score column
              <select value={scoreColumn} onChange={(e) => setScoreColumn(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-neutral-900">
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </label>
          </div>
          {labelColumn === scoreColumn && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">Label and score must be different columns.</p>}
          {parsed && parsed.rejectedRows > 0 && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Skipped {parsed.rejectedRows.toLocaleString()} rows with invalid label/score values. They are not silently converted to zero.</p>}
        </Card>
      )}

      {rows.length > 0 && labelColumn !== scoreColumn && (
        <>
          <Card className="!p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Dataset summary</div>
                <div className="mt-1 text-lg font-black">{summary.n.toLocaleString()} valid rows</div>
              </div>
              <Badge tone="neutral">local CSV · measured from file</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Fraud prevalence" value={pct(summary.prevalence)} />
              <Metric label="Average precision" value={summary.averagePrecision == null ? '—' : summary.averagePrecision.toFixed(3)} />
              <Metric label="Positive rows" value={summary.positives.toLocaleString()} />
              <Metric label="Negative rows" value={summary.negatives.toLocaleString()} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              Average precision summarizes the precision–recall ranking. Raw accuracy is intentionally not promoted here because a highly imbalanced fraud dataset can look “accurate” while missing nearly every positive case.
            </p>
          </Card>

          <Card className="!p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Decision threshold</div>
                <div className="text-2xl font-black">{threshold.toFixed(2)}</div>
              </div>
              <span className="text-xs text-neutral-500">score ≥ threshold → flagged</span>
            </div>
            <input
              aria-label="Fraud decision threshold"
              className="mt-4 w-full"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Precision" value={pct(metrics.precision)} />
              <Metric label="Recall" value={pct(metrics.recall)} />
              <Metric label="False-negative rate" value={pct(metrics.falseNegativeRate)} />
              <Metric label="Flagged share" value={pct(metrics.predictedPositiveRate)} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <Count label="TP" value={metrics.tp} />
              <Count label="FP" value={metrics.fp} />
              <Count label="FN" value={metrics.fn} />
              <Count label="TN" value={metrics.tn} />
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              Lowering the threshold usually catches more fraud but can block more legitimate transactions. Raising it usually reduces false alarms but can miss more fraud. Panacea shows the observed trade-off from your file; it does not choose a real-world banking threshold for you.
            </div>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Educational analytics only. No transaction is approved, denied, blocked, reported, or transmitted. Metrics are calculated only from the uploaded labels and scores; no model quality or business outcome is fabricated.
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5"><div className="text-lg font-black">{value}</div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</div></div>
}

function Count({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5"><div className="font-black">{value.toLocaleString()}</div><div className="text-[10px] font-bold text-neutral-500">{label}</div></div>
}

export default FraudThresholdLab
