// Wearable / device data processor — takes a raw CSV export from a wearable,
// CGM, smart scale, BP cuff, or health app and turns the numbers into
// human-meaningful conclusions. Everything runs client-side; nothing is sent
// anywhere. This is the "mengolah data" engine: raw hardware rows in →
// interpreted summaries out.

export interface ColumnStats {
  key: string; label: string; unit: string
  n: number; mean: number; min: number; max: number; sd: number
  trend: number            // % change first-half → second-half
  metric: MetricKind
  conclusions: string[]    // human-readable takeaways
  tone: 'good' | 'watch' | 'alert' | 'neutral'
}

export type MetricKind = 'glucose' | 'heartRate' | 'steps' | 'sleep' | 'spo2' | 'weight' | 'systolic' | 'diastolic' | 'hrv' | 'generic'

export interface AnalysisResult {
  rows: number
  columns: ColumnStats[]
  headline: string
}

// ── CSV parsing (handles quoted fields & BOM) ────────────────────────────────
function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (c === ',' && !q) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

// Map a column header to a known metric by keyword.
function detectMetric(header: string): { metric: MetricKind; label: string; unit: string } | null {
  const h = header.toLowerCase()
  if (/(glucose|blood sugar|mg\/dl|mmol)/.test(h)) return { metric: 'glucose', label: 'Glucose', unit: 'mg/dL' }
  if (/(resting.*(hr|heart)|heart rate|\bhr\b|bpm|pulse)/.test(h) && !/variab/.test(h)) return { metric: 'heartRate', label: 'Heart Rate', unit: 'bpm' }
  if (/(hrv|rmssd|sdnn|heart rate variab)/.test(h)) return { metric: 'hrv', label: 'HRV', unit: 'ms' }
  if (/(step)/.test(h)) return { metric: 'steps', label: 'Steps', unit: '' }
  if (/(sleep|asleep)/.test(h)) return { metric: 'sleep', label: 'Sleep', unit: 'h' }
  if (/(spo2|oxygen|sao2|o2 sat)/.test(h)) return { metric: 'spo2', label: 'SpO₂', unit: '%' }
  if (/(weight|mass|\bkg\b|\blbs?\b)/.test(h)) return { metric: 'weight', label: 'Weight', unit: 'kg' }
  if (/(systolic|\bsys\b|\bsbp\b)/.test(h)) return { metric: 'systolic', label: 'Systolic BP', unit: 'mmHg' }
  if (/(diastolic|\bdia\b|\bdbp\b)/.test(h)) return { metric: 'diastolic', label: 'Diastolic BP', unit: 'mmHg' }
  return null
}

function stats(nums: number[]) {
  const n = nums.length
  const mean = nums.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / n)
  const half = Math.floor(n / 2)
  const firstAvg = nums.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half)
  const secondAvg = nums.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, n - half)
  const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
  return { n, mean, min: Math.min(...nums), max: Math.max(...nums), sd, trend }
}

// ── Metric-specific interpretation — the "conclusions for humans" ────────────
function interpret(metric: MetricKind, s: ReturnType<typeof stats>, nums: number[]): { conclusions: string[]; tone: ColumnStats['tone'] } {
  const pct = (n: number) => Math.round((n / nums.length) * 100)
  switch (metric) {
    case 'glucose': {
      const inRange = nums.filter((v) => v >= 70 && v <= 180).length
      const high = nums.filter((v) => v > 180).length
      const low = nums.filter((v) => v < 70).length
      const cv = (s.sd / s.mean) * 100
      const gmi = 3.31 + 0.02392 * s.mean // estimated HbA1c (%) from mean glucose
      const c = [
        `Time in range (70–180): ${pct(inRange)}% — target is ≥70%.`,
        `Average glucose ${Math.round(s.mean)} mg/dL → estimated HbA1c ≈ ${gmi.toFixed(1)}%.`,
        `Glucose variability (CV) ${cv.toFixed(0)}% — under 36% is considered stable.`,
      ]
      if (high > 0) c.push(`${pct(high)}% of readings were high (>180).`)
      if (low > 0) c.push(`⚠️ ${pct(low)}% of readings were low (<70) — discuss hypoglycemia with your doctor.`)
      const tone: ColumnStats['tone'] = low > 0 || pct(inRange) < 50 ? 'alert' : pct(inRange) < 70 || cv > 36 ? 'watch' : 'good'
      return { conclusions: c, tone }
    }
    case 'heartRate': {
      const resting = Math.round(s.min)
      const c = [`Lowest (≈ resting) HR ${resting} bpm — 50–60 is athletic, 60–70 healthy.`, `Average ${Math.round(s.mean)} bpm, peak ${Math.round(s.max)} bpm.`]
      const tone: ColumnStats['tone'] = resting > 85 ? 'watch' : 'good'
      if (resting > 85) c.push('Resting HR looks elevated — can reflect stress, poor sleep, or deconditioning.')
      return { conclusions: c, tone }
    }
    case 'hrv': {
      const c = [`Average HRV ${Math.round(s.mean)} ms.`, s.trend >= 5 ? 'Trending up — improving recovery/adaptation. 💪' : s.trend <= -5 ? 'Trending down — accumulating fatigue or stress; prioritize sleep & easy days.' : 'Stable.']
      return { conclusions: c, tone: s.trend <= -10 ? 'watch' : 'good' }
    }
    case 'steps': {
      const avg = Math.round(s.mean)
      const c = [`Average ${avg.toLocaleString()} steps/reading.`, avg >= 8000 ? 'At or above the 7–8k activity sweet spot. ✅' : 'Below ~7–8k; each extra 1–2k/day meaningfully lowers mortality risk.']
      return { conclusions: c, tone: avg >= 7000 ? 'good' : 'watch' }
    }
    case 'sleep': {
      const avg = s.mean
      const c = [`Average ${avg.toFixed(1)} h.`, avg >= 7 && avg <= 9 ? 'Within the 7–9h adult range. ✅' : avg < 7 ? 'Below 7h — sleep debt affects recovery, HRV, mood & metabolism.' : 'Longer than typical — occasionally a sign of poor sleep quality or illness.']
      return { conclusions: c, tone: avg >= 7 && avg <= 9 ? 'good' : 'watch' }
    }
    case 'spo2': {
      const bel7 = nums.filter((v) => v < 90).length
      const c = [`Average ${s.mean.toFixed(1)}%, lowest ${Math.round(s.min)}%.`]
      if (bel7 > 0) c.push(`⚠️ ${pct(bel7)}% of readings below 90% — recurrent nocturnal dips can indicate sleep apnea; discuss with a clinician.`)
      else c.push('No readings below 90% — normal oxygenation.')
      return { conclusions: c, tone: bel7 > 0 ? 'alert' : 'good' }
    }
    case 'weight': {
      const delta = s.trend
      const c = [`Range ${s.min.toFixed(1)}–${s.max.toFixed(1)}; ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta).toFixed(1)}% across the period.`]
      return { conclusions: c, tone: 'neutral' }
    }
    case 'systolic': {
      const c = [`Average ${Math.round(s.mean)} mmHg systolic.`, s.mean >= 140 ? '⚠️ Averages in the hypertensive range (≥140) — confirm with a clinician.' : s.mean >= 130 ? 'Elevated (130–139) — worth monitoring & lifestyle changes.' : 'Within a healthy range.']
      return { conclusions: c, tone: s.mean >= 140 ? 'alert' : s.mean >= 130 ? 'watch' : 'good' }
    }
    case 'diastolic': {
      const c = [`Average ${Math.round(s.mean)} mmHg diastolic.`, s.mean >= 90 ? '⚠️ In the hypertensive range (≥90).' : 'Within a typical range.']
      return { conclusions: c, tone: s.mean >= 90 ? 'alert' : 'good' }
    }
    default: {
      return { conclusions: [`Average ${s.mean.toFixed(1)}, range ${s.min.toFixed(1)}–${s.max.toFixed(1)}. Trend ${s.trend >= 0 ? '+' : ''}${s.trend.toFixed(0)}%.`], tone: 'neutral' }
    }
  }
}

export function analyzeCsv(text: string): AnalysisResult {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: 0, columns: [], headline: 'The file has no data rows.' }
  const headers = splitCsvLine(lines[0])
  const dataLines = lines.slice(1)

  const columns: ColumnStats[] = []
  headers.forEach((header, ci) => {
    // Skip date/time/id columns — they aren't health metrics and a year like
    // "2024" would otherwise be summarized as a meaningless number.
    if (/(date|time|timestamp|\bday\b|\bid\b|index)/i.test(header)) return
    const det = detectMetric(header)
    // Collect numeric values in this column.
    const nums: number[] = []
    for (const line of dataLines) {
      const cells = splitCsvLine(line)
      const raw = (cells[ci] ?? '').replace(/[^0-9.\-]/g, '')
      const v = parseFloat(raw)
      if (Number.isFinite(v)) nums.push(v)
    }
    if (nums.length < 3) return // skip non-numeric / sparse columns
    const metric = det?.metric ?? 'generic'
    const label = det?.label ?? header
    const unit = det?.unit ?? ''
    const s = stats(nums)
    const { conclusions, tone } = interpret(metric, s, nums)
    columns.push({ key: header, label, unit, n: s.n, mean: s.mean, min: s.min, max: s.max, sd: s.sd, trend: s.trend, metric, conclusions, tone })
  })

  const recognized = columns.filter((c) => c.metric !== 'generic').length
  const headline = columns.length === 0
    ? 'No numeric columns found — is this a data export?'
    : `Processed ${dataLines.length.toLocaleString()} rows across ${columns.length} numeric columns (${recognized} recognized as health metrics).`
  return { rows: dataLines.length, columns, headline }
}
