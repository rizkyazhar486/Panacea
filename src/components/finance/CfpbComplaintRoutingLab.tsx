import { useMemo, useRef, useState } from 'react'
import { Badge, Card, Field, inputClass } from '../ui'
import {
  parseComplaintCsv,
  routeComplaint,
  suggestComplaintColumns,
  type ComplaintRecord,
} from '../../lib/finance/cfpbComplaintRouting'

const MAX_BYTES = 25 * 1024 * 1024
const MAX_RECORDS = 5_000

export function CfpbComplaintRoutingLab() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [narrativeColumn, setNarrativeColumn] = useState('')
  const [productColumn, setProductColumn] = useState('')
  const [idColumn, setIdColumn] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const records = useMemo<ComplaintRecord[]>(() => {
    const narrativeIndex = headers.indexOf(narrativeColumn)
    const productIndex = headers.indexOf(productColumn)
    const idIndex = headers.indexOf(idColumn)
    if (narrativeIndex < 0 || productIndex < 0) return []
    return rows
      .map((row, index) => ({
        id: idIndex >= 0 ? row[idIndex]?.trim() || String(index + 1) : String(index + 1),
        narrative: row[narrativeIndex]?.trim() || '',
        product: row[productIndex]?.trim() || '',
      }))
      .filter((record) => record.narrative.length >= 20 && record.product.length > 0)
      .slice(0, MAX_RECORDS)
  }, [headers, idColumn, narrativeColumn, productColumn, rows])

  const route = useMemo(() => routeComplaint(records, query), [records, query])

  async function readFile(file?: File) {
    if (!file) return
    setError('')
    if (file.size > MAX_BYTES) {
      setError('File is larger than 25 MB. Export a smaller CFPB sample and try again.')
      return
    }
    try {
      const parsed = parseComplaintCsv(await file.text())
      if (parsed.headers.length < 2 || parsed.rows.length === 0) {
        setError('No usable CSV table was found.')
        return
      }
      const suggested = suggestComplaintColumns(parsed.headers)
      setFileName(file.name)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setNarrativeColumn(suggested.narrative || parsed.headers[0])
      setProductColumn(suggested.product || parsed.headers[1])
      setIdColumn(suggested.id)
    } catch {
      setError('The file could not be read as CSV.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <h2 className="text-base font-black text-ink dark:text-ink">CFPB Complaint Routing Lab</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Import a CFPB Consumer Complaint Database CSV, then compare a new narrative with the
          closest labeled complaints. Processing stays in this browser.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 min-h-11 w-full rounded-2xl border-2 border-dashed border-brand/40 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-dark dark:bg-white/5"
        >
          {fileName ? `Replace CSV · ${fileName}` : 'Choose CFPB CSV'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(event) => readFile(event.target.files?.[0])}
        />
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

        {headers.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Complaint narrative">
              <select className={inputClass} value={narrativeColumn} onChange={(event) => setNarrativeColumn(event.target.value)}>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </Field>
            <Field label="Known product/category">
              <select className={inputClass} value={productColumn} onChange={(event) => setProductColumn(event.target.value)}>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </Field>
            <Field label="Complaint ID (optional)">
              <select className={inputClass} value={idColumn} onChange={(event) => setIdColumn(event.target.value)}>
                <option value="">Row number</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </Field>
          </div>
        )}
        {headers.length > 0 && (
          <p className="mt-2 text-xs text-neutral-500" role="status">
            {records.length.toLocaleString()} usable labeled complaints loaded
            {rows.length > MAX_RECORDS ? ` · first ${MAX_RECORDS.toLocaleString()} used for responsive local comparison` : ''}.
          </p>
        )}
      </Card>

      <Card className="!p-5">
        <Field label="Complaint narrative to route">
          <textarea
            className={`${inputClass} min-h-32`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Paste or type a consumer complaint narrative…"
          />
        </Field>

        {query.trim() && (
          <div className="mt-4" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={route.candidate ? (route.uncertain ? 'low' : 'brand') : 'neutral'}>
                {route.candidate ? (route.uncertain ? 'Needs review' : 'Routing candidate') : 'Not enough evidence'}
              </Badge>
              {route.candidate && <strong className="text-sm text-ink dark:text-ink">{route.candidate}</strong>}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{route.reason}</p>

            {route.alternatives.length > 0 && (
              <div className="mt-3 space-y-2">
                {route.alternatives.slice(0, 4).map((alternative) => (
                  <div key={alternative.product}>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="font-semibold text-ink dark:text-ink">{alternative.product}</span>
                      <span className="shrink-0 text-neutral-500">
                        {(alternative.evidenceShare * 100).toFixed(0)}% neighbor evidence · {alternative.matches} match{alternative.matches === 1 ? '' : 'es'}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${alternative.evidenceShare * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {route.neighbors.length > 0 && (
        <Card className="!p-5">
          <h3 className="text-sm font-black text-ink dark:text-ink">Closest imported complaints</h3>
          <div className="mt-3 space-y-2">
            {route.neighbors.map((neighbor) => (
              <article key={neighbor.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="flex flex-wrap justify-between gap-2 text-[11px] text-neutral-500">
                  <span>Complaint {neighbor.id} · {neighbor.product}</span>
                  <span>{(neighbor.similarity * 100).toFixed(0)}% text similarity</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-neutral-700 dark:text-neutral-200">
                  {neighbor.narrative.slice(0, 260)}{neighbor.narrative.length > 260 ? '…' : ''}
                </p>
              </article>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
        The result is a transparent routing aid based only on the imported examples—not a CFPB
        decision, legal conclusion, complaint outcome, or model probability. Similarity and
        neighbor share can be wrong; uncertain cases require human review. No CFPB data is bundled.
      </div>
    </div>
  )
}
