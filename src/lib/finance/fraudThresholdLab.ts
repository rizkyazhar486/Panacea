export interface FraudObservation {
  label: 0 | 1
  score: number
}

export interface FraudParseResult {
  headers: string[]
  rows: FraudObservation[]
  rejectedRows: number
}

export interface FraudMetrics {
  threshold: number
  tp: number
  fp: number
  tn: number
  fn: number
  precision: number | null
  recall: number | null
  falsePositiveRate: number | null
  falseNegativeRate: number | null
  predictedPositiveRate: number
}

export interface FraudSummary {
  n: number
  positives: number
  negatives: number
  prevalence: number
  averagePrecision: number | null
}

function parseCsvRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (ch === ',' && !quoted) {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

export function csvHeaders(text: string): string[] {
  const first = text.split(/\r?\n/).find((line) => line.trim().length > 0)
  return first ? parseCsvRow(first).map((x) => x.replace(/^"|"$/g, '').trim()) : []
}

export function inferFraudColumns(headers: string[]): { label: string | null; score: string | null } {
  const normalized = new Map(headers.map((h) => [h.toLowerCase().replace(/[^a-z0-9]/g, ''), h]))
  const pick = (candidates: string[]) => candidates.map((c) => normalized.get(c)).find(Boolean) ?? null
  return {
    label: pick(['class', 'label', 'target', 'isfraud', 'fraud', 'ytrue']),
    score: pick(['score', 'probability', 'prob', 'fraudprobability', 'fraudscore', 'yscore', 'prediction']),
  }
}

export function parseFraudCsv(text: string, labelColumn: string, scoreColumn: string): FraudParseResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [], rejectedRows: 0 }
  const headers = parseCsvRow(lines[0]).map((x) => x.replace(/^"|"$/g, '').trim())
  const labelIndex = headers.indexOf(labelColumn)
  const scoreIndex = headers.indexOf(scoreColumn)
  if (labelIndex < 0 || scoreIndex < 0 || labelIndex === scoreIndex) {
    return { headers, rows: [], rejectedRows: Math.max(0, lines.length - 1) }
  }

  const rows: FraudObservation[] = []
  let rejectedRows = 0
  for (const line of lines.slice(1)) {
    const cells = parseCsvRow(line)
    const rawLabel = Number(cells[labelIndex])
    const score = Number(cells[scoreIndex])
    if ((rawLabel !== 0 && rawLabel !== 1) || !Number.isFinite(score) || score < 0 || score > 1) {
      rejectedRows += 1
      continue
    }
    rows.push({ label: rawLabel as 0 | 1, score })
  }
  return { headers, rows, rejectedRows }
}

export function metricsAtThreshold(rows: FraudObservation[], threshold: number): FraudMetrics {
  const t = Math.max(0, Math.min(1, threshold))
  let tp = 0; let fp = 0; let tn = 0; let fn = 0
  for (const row of rows) {
    const positive = row.score >= t
    if (positive && row.label === 1) tp += 1
    else if (positive) fp += 1
    else if (row.label === 1) fn += 1
    else tn += 1
  }
  const precisionDen = tp + fp
  const recallDen = tp + fn
  const fprDen = fp + tn
  return {
    threshold: t,
    tp, fp, tn, fn,
    precision: precisionDen ? tp / precisionDen : null,
    recall: recallDen ? tp / recallDen : null,
    falsePositiveRate: fprDen ? fp / fprDen : null,
    falseNegativeRate: recallDen ? fn / recallDen : null,
    predictedPositiveRate: rows.length ? (tp + fp) / rows.length : 0,
  }
}

/**
 * Average precision: precision integrated over each positive-labelled recall step.
 * This mirrors the interpretation of average_precision_score more closely than
 * raw accuracy for highly imbalanced binary events.
 */
export function averagePrecision(rows: FraudObservation[]): number | null {
  const positives = rows.reduce((sum, row) => sum + row.label, 0)
  if (!rows.length || positives === 0) return null
  const sorted = [...rows].sort((a, b) => b.score - a.score)
  let tp = 0
  let fp = 0
  let total = 0
  for (const row of sorted) {
    if (row.label === 1) {
      tp += 1
      total += (tp / (tp + fp)) / positives
    } else {
      fp += 1
    }
  }
  return total
}

export function summarizeFraudRows(rows: FraudObservation[]): FraudSummary {
  const positives = rows.reduce((sum, row) => sum + row.label, 0)
  return {
    n: rows.length,
    positives,
    negatives: rows.length - positives,
    prevalence: rows.length ? positives / rows.length : 0,
    averagePrecision: averagePrecision(rows),
  }
}
