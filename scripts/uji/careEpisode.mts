// Regression coverage for the Care Episode Graph (src/lib/careEpisode.ts).
// Written after three real bugs (stale itemized costs surviving a candidate
// switch, a manual total silently discarded on itemizing, and a dangling
// provider reference after removing the chosen candidate) shipped and were
// only caught by manual browser testing. Without this file, any of them
// could come back with nothing in CI to notice.
import {
  newCareEpisode,
  setStageStatus,
  detectStalls,
  episodeHealth,
  setExpectedDays,
  formatCostRange,
  addCandidate,
  removeCandidate,
  updateCandidateCost,
  chooseCandidate,
  candidateViews,
  addCostItem,
  updateCostItem,
  removeCostItem,
  ensureEpisodeFromVerifiedPlan,
} from '../../src/lib/careEpisode.ts'
import type { CareEpisode, EMRRecord } from '../../src/lib/types.ts'

const chk = (n: string, c: boolean, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x)

// --- stage cascade: recovery + follow-up run in parallel, outcome waits on both ---
{
  let ep = newCareEpisode('Test')
  for (const s of ['problem', 'diagnosis', 'plan', 'provider', 'cost', 'schedule', 'treatment'] as const) {
    ep = setStageStatus(ep, s, 'done')
  }
  const recovery = ep.stages.find((s) => s.stage === 'recovery')!
  const followUp = ep.stages.find((s) => s.stage === 'followUp')!
  chk('recovery activates when treatment is done', recovery.status === 'active')
  chk('followUp activates when treatment is done', followUp.status === 'active')

  ep = setStageStatus(ep, 'recovery', 'done')
  const outcomeAfterOne = ep.stages.find((s) => s.stage === 'outcome')!
  chk('outcome stays pending with only recovery done', outcomeAfterOne.status === 'pending')

  ep = setStageStatus(ep, 'followUp', 'done')
  const outcomeAfterBoth = ep.stages.find((s) => s.stage === 'outcome')!
  chk('outcome activates once both recovery and followUp are done', outcomeAfterBoth.status === 'active')
}

// --- ensureEpisodeFromVerifiedPlan: seeds once, idempotent on re-verify ---
{
  const record: EMRRecord = {
    id: 'r1', patientId: 'p1', createdAt: '', updatedAt: '',
    anamnesis: {} as EMRRecord['anamnesis'], physicalExam: {} as EMRRecord['physicalExam'],
    problems: [{ id: 'prob1', title: 'X', basis: '', assessment: '' }],
    plan: [], references: [],
    primaryDiagnosis: { code: 'K80.2', title: 'Gallstone' },
  }
  const seeded = ensureEpisodeFromVerifiedPlan(record)
  chk('seeds exactly one episode for a fresh diagnosis', (seeded.careEpisodes ?? []).length === 1)
  const ep = seeded.careEpisodes![0]
  chk('seeded episode marks problem done', ep.stages.find((s) => s.stage === 'problem')!.status === 'done')
  chk('seeded episode marks diagnosis done', ep.stages.find((s) => s.stage === 'diagnosis')!.status === 'done')
  chk('seeded episode activates plan', ep.stages.find((s) => s.stage === 'plan')!.status === 'active')

  const seededAgain = ensureEpisodeFromVerifiedPlan(seeded)
  chk('re-verifying the same diagnosis does not duplicate the episode', (seededAgain.careEpisodes ?? []).length === 1)
}

// --- formatCostRange: confidence controls the "~" prefix ---
{
  const base = newCareEpisode('Cost test')
  const estimated: CareEpisode = { ...base, estimatedCostLow: 10, estimatedCostHigh: 20, costConfidence: 'estimated' }
  const verified: CareEpisode = { ...base, estimatedCostLow: 10, estimatedCostHigh: 20, costConfidence: 'verified' }
  chk('estimated cost is prefixed with ~', formatCostRange(estimated)!.startsWith('~'))
  chk('verified cost has no ~ prefix', !formatCostRange(verified)!.startsWith('~'))
  chk('no cost fields means no range', formatCostRange(base) === undefined)
}

// --- candidate comparison + choosing ---
{
  let ep = newCareEpisode('Candidates test')
  ep = addCandidate(ep, 'h1')
  ep = addCandidate(ep, 'h2')
  chk('adding the same facility twice does not duplicate', addCandidate(ep, 'h1').candidates!.length === 2)
  chk('candidateViews sorts by real distance', candidateViews(ep)[0].facility.distanceKm <= candidateViews(ep)[1].facility.distanceKm)

  ep = updateCandidateCost(ep, 'h1', { low: 1000, high: 2000, confidence: 'estimated' })
  ep = chooseCandidate(ep, 'h1')
  chk('choosing a candidate sets the episode facilityId', ep.facilityId === 'h1')
  chk('choosing a candidate promotes its cost to the episode total', ep.estimatedCostLow === 1000 && ep.estimatedCostHigh === 2000)
}

// --- BUG FIX REGRESSION: chooseCandidate must clear a stale itemized breakdown ---
{
  let ep = newCareEpisode('Regression: stale costItems')
  ep = addCandidate(ep, 'h1')
  ep = chooseCandidate(ep, 'h1')
  ep = addCostItem(ep, 'Professional fee', { low: 5000, high: 8000, confidence: 'estimated' })
  chk('itemizing under candidate A sets a total', ep.estimatedCostLow === 5000)

  ep = addCandidate(ep, 'h2')
  ep = chooseCandidate(ep, 'h2') // h2 has no candidate cost data
  chk('choosing a different, unpriced candidate clears the stale itemized total', ep.estimatedCostLow === undefined)
  chk('choosing a different candidate clears the stale costItems array', (ep.costItems ?? []).length === 0)
}

// --- BUG FIX REGRESSION: "break down" must seed from — not discard — the manual total ---
// (the UI seeds the first item from the current manual fields; this checks the
// underlying primitive actually accepts and applies a seed rather than only a label)
{
  let ep = newCareEpisode('Regression: seeded breakdown')
  ep = addCostItem(ep, 'Professional fee', { low: 20000, high: 30000, confidence: 'estimated' })
  chk('addCostItem with a seed produces the seeded total immediately', ep.estimatedCostLow === 20000 && ep.estimatedCostHigh === 30000)
}

// --- BUG FIX REGRESSION: removing the CHOSEN candidate must not leave a dangling reference ---
{
  let ep = newCareEpisode('Regression: dangling provider')
  ep = addCandidate(ep, 'h1')
  ep = addCandidate(ep, 'h2')
  ep = chooseCandidate(ep, 'h1')
  chk('sanity: h1 is chosen', ep.facilityId === 'h1')

  ep = removeCandidate(ep, 'h1')
  chk('removing the chosen candidate clears facilityId', ep.facilityId === undefined)
  chk('removing the chosen candidate clears providerName', ep.providerName === undefined)
  chk('removing the chosen candidate leaves the other candidate untouched', ep.candidates!.some((c) => c.facilityId === 'h2'))

  let ep2 = newCareEpisode('Regression: non-chosen removal')
  ep2 = addCandidate(ep2, 'h1')
  ep2 = addCandidate(ep2, 'h2')
  ep2 = chooseCandidate(ep2, 'h1')
  ep2 = removeCandidate(ep2, 'h2') // removing a non-chosen candidate
  chk('removing a non-chosen candidate leaves the choice intact', ep2.facilityId === 'h1')
}

// --- Total Cost of Care: sum math, partial pricing, verified-only-if-all-verified ---
{
  let ep = newCareEpisode('Total cost test')
  ep = addCostItem(ep, 'Professional fee', { low: 5_000_000, high: 8_000_000, confidence: 'estimated' })
  ep = addCostItem(ep, 'Facility/room', { low: 10_000_000, high: 15_000_000, confidence: 'verified' })
  const labId = (() => {
    const withLab = addCostItem(ep, 'Laboratory')
    ep = withLab
    return withLab.costItems!.find((i) => i.label === 'Laboratory')!.id
  })()
  ep = updateCostItem(ep, labId, { low: 1_500_000, confidence: 'estimated' }) // no high on purpose

  chk('total low sums all priced items', ep.estimatedCostLow === 16_500_000, String(ep.estimatedCostLow))
  chk('total high sums only items with a high value', ep.estimatedCostHigh === 23_000_000, String(ep.estimatedCostHigh))
  chk('confidence stays estimated when not every item is verified', ep.costConfidence === 'estimated')
  chk('cost source reports completeness', ep.costSource === '3 of 3 components priced', ep.costSource)

  ep = removeCostItem(ep, labId)
  chk('removing an item drops it from the total', ep.estimatedCostLow === 15_000_000, String(ep.estimatedCostLow))

  let allVerified = newCareEpisode('All verified')
  allVerified = addCostItem(allVerified, 'A', { low: 1, high: 2, confidence: 'verified' })
  allVerified = addCostItem(allVerified, 'B', { low: 3, high: 4, confidence: 'verified' })
  chk('confidence is verified only when every priced item is verified', allVerified.costConfidence === 'verified')
}

// --- Care failure detection: stall thresholds and overrides ---
{
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
  let ep = newCareEpisode('Stall test')
  ep = { ...ep, stages: ep.stages.map((s) => (s.stage === 'provider' ? { ...s, status: 'active', updatedAt: daysAgo(8) } : s)) }

  chk('a stage past its expected days is stalled', detectStalls(ep).some((s) => s.stage === 'provider' && s.severity === 'stalled'))
  chk('episode health is stalled when a stage is stalled', episodeHealth(ep) === 'stalled')

  const overridden = setExpectedDays(ep, 'provider', 30)
  chk('overriding expected days clears the stall for that stage', detectStalls(overridden).length === 0)
  chk('a fresh, on-track episode reports on_track health', episodeHealth(newCareEpisode('Fresh')) === 'on_track')

  const blocked = setStageStatus(newCareEpisode('Blocked test'), 'problem', 'blocked', { blockedReason: 'x' })
  chk('a blocked stage makes the episode health stalled even with zero elapsed time', episodeHealth(blocked) === 'stalled')
}
