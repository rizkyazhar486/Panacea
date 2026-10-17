// F2: Only observed, finite Web Vitals lab measurements are eligible for performance evidence.
// A missing metric is not a score of 0 and cannot satisfy a performance gate.
export const ESSENTIAL_METRICS = Object.freeze(['lcpMs', 'cls', 'tbtMs'])
export function perfSampleProblem(sample) {
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) return 'malformed sample'
  if (sample.galat) return String(sample.galat)
  for (const name of ESSENTIAL_METRICS) {
    const x = sample[name]
    if (typeof x !== 'number' || !Number.isFinite(x) || x < 0) return `unmeasured ${name}`
  }
  return null
}
export function enoughPerfEvidence(samples, required) {
  if (!Array.isArray(samples) || !Number.isInteger(required) || required < 1) return false
  return samples.filter(s => perfSampleProblem(s) === null).length >= required
}
