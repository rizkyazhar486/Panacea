// Physiological Drift Detection is deliberately real statistics (z-score
// against the patient's own history), not an invented health score — these
// tests exist to keep it that way: honest about insufficient data, honest
// about zero variance, and correct about the actual math.
import { detectDrift } from '../../src/lib/physiologicalDrift.ts'
import type { VitalSign } from '../../src/lib/types.ts'

const chk = (n: string, c: boolean, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x)

function v(overrides: Partial<VitalSign>): VitalSign {
  return {
    id: `v_${Math.random()}`, takenAt: new Date().toISOString(),
    systolic: 120, diastolic: 80, heartRate: 70, respRate: 16, tempC: 36.6, spo2: 98,
    ...overrides,
  }
}

// --- insufficient data: fewer than the minimum baseline samples ---
{
  const vitals = [v({ heartRate: 70 }), v({ heartRate: 71 }), v({ heartRate: 200 })]
  chk('too few readings produces no findings, even with an extreme latest value', detectDrift(vitals).length === 0)
}

// --- stable baseline, latest matches it: no drift ---
{
  const vitals = Array.from({ length: 8 }, () => v({ heartRate: 70 }))
  chk('identical readings produce no findings (zero variance, nothing to compare)', detectDrift(vitals).length === 0)
}

// --- real drift: heart rate climbing well past the patient's own baseline ---
{
  const baseline = [68, 70, 69, 71, 70, 69, 70, 71]
  const vitals = baseline.map((hr) => v({ heartRate: hr }))
  vitals.push(v({ heartRate: 90 })) // clear jump
  const findings = detectDrift(vitals)
  const hrFinding = findings.find((f) => f.key === 'heartRate')
  chk('a clear jump above baseline is detected', !!hrFinding)
  chk('direction is reported as up', hrFinding?.direction === 'up')
  chk('severity escalates to drift for a large jump', hrFinding?.severity === 'drift', String(hrFinding?.zScore))
  chk('sample size reflects the actual prior reading count', hrFinding?.sampleSize === 8)
}

// --- watch vs drift severity boundary ---
{
  // baseline with real variance (mean 70, sd ~5.77) so a deviation to 82
  // lands at z ~2.08 — past the "watch" line (1.5) but short of "drift" (2.5)
  const baseline = [60, 65, 70, 75, 80, 65, 70, 75, 70]
  const vitals = baseline.map((hr) => v({ heartRate: hr }))
  vitals.push(v({ heartRate: 82 }))
  const findings = detectDrift(vitals)
  const hrFinding = findings.find((f) => f.key === 'heartRate')
  chk('a moderate deviation is classified as watch, not drift', hrFinding?.severity === 'watch', String(hrFinding?.zScore))
}

// --- direction down is reported correctly ---
{
  const baseline = [98, 98, 97, 98, 99, 98, 97]
  const vitals = baseline.map((spo2) => v({ spo2 }))
  vitals.push(v({ spo2: 90 }))
  const findings = detectDrift(vitals)
  const spo2Finding = findings.find((f) => f.key === 'spo2')
  chk('a drop below baseline is detected with direction down', spo2Finding?.direction === 'down')
}

// --- multiple metrics can drift independently in the same reading ---
{
  // both metrics need real (non-zero) baseline variance, or they're
  // correctly skipped as "no real variation to compare against" (see the
  // zero-variance test above) — a flat baseline is not a bug, so give both
  // metrics a touch of natural variation here.
  const hrBase = [68, 70, 69, 71, 70, 72]
  const tempBase = [36.5, 36.6, 36.7, 36.5, 36.6, 36.7]
  const baseline = hrBase.map((hr, i) => v({ heartRate: hr, tempC: tempBase[i] }))
  const vitals = [...baseline, v({ heartRate: 95, tempC: 38.2 })]
  const findings = detectDrift(vitals)
  chk('unrelated metrics that both drift are both reported', findings.some((f) => f.key === 'heartRate') && findings.some((f) => f.key === 'tempC'))
  chk('a metric that did not move is not reported', !findings.some((f) => f.key === 'spo2'))
}
