// The four signals the Home brief shows, as data: label, unit, how a day is drawn, colour, and the span outside
// which a device value is an error rather than a reading. The span is a plausibility guard for corrupt imports,
// not a clinical range: it says nothing about health, and nothing inside it is called good or bad.

export type GlanceMetricId = 'steps' | 'sleepH' | 'restingHr' | 'vo2max'
/** Signals the Health Data analyzer reads beyond the four Home tiles; same contract, same honesty rules. */
export type AnalyzerMetricId = GlanceMetricId | 'hrvMs' | 'spo2Pct' | 'respRate' | 'systolic' | 'weightKg'

export interface GlanceMetric {
  id: AnalyzerMetricId
  label: string
  /** Shown after the number; empty when the count needs none. */
  unit: string
  /** Decimals shown. */
  digits: number
  /** A daily total is drawn as bars from zero; a daily level as a line. */
  mark: 'bars' | 'line'
  /** Series colour: light and dark steps of one hue, validated together (contrast ≥ 3:1, CVD-separated). */
  hue: { light: string; dark: string }
  plausible: { min: number; max: number }
  /** The page that explains this signal in depth. */
  deepLink: string
  /** One sentence on what the number is. */
  about: string
}

export const GLANCE_METRICS: readonly GlanceMetric[] = [
  {
    id: 'steps', label: 'Steps', unit: 'steps', digits: 0, mark: 'bars',
    hue: { light: '#1f9d55', dark: '#26a95c' }, plausible: { min: 0, max: 100_000 },
    deepLink: '/tubuh?t=gerak', about: 'Steps your device counted in the day.',
  },
  {
    id: 'sleepH', label: 'Sleep', unit: 'h', digits: 1, mark: 'bars',
    hue: { light: '#4f6bed', dark: '#6f86f2' }, plausible: { min: 0, max: 24 },
    deepLink: '/tubuh?t=tidur', about: 'Hours asleep that your device or log recorded for the night.',
  },
  {
    id: 'restingHr', label: 'Resting HR', unit: 'bpm', digits: 0, mark: 'line',
    hue: { light: '#e0445e', dark: '#ec5872' }, plausible: { min: 20, max: 250 },
    deepLink: '/tubuh?t=jantung', about: 'Heart rate at rest, as your device estimated it for the day.',
  },
  {
    id: 'vo2max', label: 'VO₂max', unit: 'mL/kg/min', digits: 1, mark: 'line',
    hue: { light: '#0e8fb3', dark: '#1a9cbd' }, plausible: { min: 5, max: 100 },
    deepLink: '/latihan?t=lab', about: 'Your device’s estimate of aerobic capacity — an estimate, not a lab test.',
  },
]

/**
 * Every signal the analyzer can read: the Home four plus five more devices commonly send. The plausible spans are
 * corrupt-import guards (a watch reporting HRV 0 or SpO2 140), not clinical limits, exactly as above.
 */
export const ANALYZER_METRICS: readonly GlanceMetric[] = [
  ...GLANCE_METRICS,
  {
    id: 'hrvMs', label: 'HRV', unit: 'ms', digits: 0, mark: 'line',
    hue: { light: '#7c4dff', dark: '#9a77ff' }, plausible: { min: 1, max: 300 },
    deepLink: '/tubuh?t=jantung', about: 'Heart-rate variability your device estimated (usually overnight RMSSD or SDNN).',
  },
  {
    id: 'spo2Pct', label: 'SpO₂', unit: '%', digits: 0, mark: 'line',
    hue: { light: '#0b8f6f', dark: '#1aa784' }, plausible: { min: 50, max: 100 },
    deepLink: '/tubuh?t=napas', about: 'Blood-oxygen saturation from a finger or wrist sensor — wrist readings vary more.',
  },
  {
    id: 'respRate', label: 'Breathing', unit: '/min', digits: 0, mark: 'line',
    hue: { light: '#1877c9', dark: '#3b93e0' }, plausible: { min: 3, max: 80 },
    deepLink: '/tubuh?t=napas', about: 'Breaths per minute your device estimated, usually during sleep.',
  },
  {
    id: 'systolic', label: 'Systolic', unit: 'mmHg', digits: 0, mark: 'line',
    hue: { light: '#c2410c', dark: '#ea6a2a' }, plausible: { min: 50, max: 260 },
    deepLink: '/tubuh?t=jantung', about: 'The upper blood-pressure number from a cuff you used.',
  },
  {
    id: 'weightKg', label: 'Weight', unit: 'kg', digits: 1, mark: 'line',
    hue: { light: '#8a6d1f', dark: '#c09a3a' }, plausible: { min: 20, max: 400 },
    deepLink: '/health-data', about: 'Body weight from a scale or an entry you made.',
  },
]

export function glanceMetric(id: string): GlanceMetric | null {
  return ANALYZER_METRICS.find((metric) => metric.id === id) ?? null
}
