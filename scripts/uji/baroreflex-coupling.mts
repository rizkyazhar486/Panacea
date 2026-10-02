import assert from 'node:assert/strict'
import {
  BAROREFLEX_BOUNDARY,
  BAROREFLEX_EVIDENCE,
  BAROREFLEX_PATHWAY,
  deriveBaroreflexDirection,
} from '../../src/lib/physiology/baroreflexCoupling.ts'

assert.deepEqual(
  BAROREFLEX_PATHWAY.map((node) => node.id),
  ['carotid-sinus', 'aortic-arch'],
)
assert.match(BAROREFLEX_PATHWAY[0].afferent, /IX/)
assert.match(BAROREFLEX_PATHWAY[1].afferent, /X/)
for (const node of BAROREFLEX_PATHWAY) assert.match(node.centralTarget, /NTS/)

const rise = deriveBaroreflexDirection('pressure-rise')
assert.deepEqual(
  {
    stretch: rise.sensorStretchDirection,
    afferent: rise.afferentFiringDirection,
    sympathetic: rise.sympatheticDirection,
    vagal: rise.vagalDirection,
    hr: rise.heartRateDirection,
    contractility: rise.contractilityDirection,
    arteriolar: rise.arteriolarToneDirection,
    venous: rise.venousToneDirection,
  },
  {
    stretch: 'increase',
    afferent: 'increase',
    sympathetic: 'decrease',
    vagal: 'increase',
    hr: 'decrease',
    contractility: 'decrease',
    arteriolar: 'decrease',
    venous: 'decrease',
  },
)

const fall = deriveBaroreflexDirection('pressure-fall')
assert.deepEqual(
  {
    stretch: fall.sensorStretchDirection,
    afferent: fall.afferentFiringDirection,
    sympathetic: fall.sympatheticDirection,
    vagal: fall.vagalDirection,
    hr: fall.heartRateDirection,
    contractility: fall.contractilityDirection,
    arteriolar: fall.arteriolarToneDirection,
    venous: fall.venousToneDirection,
  },
  {
    stretch: 'decrease',
    afferent: 'decrease',
    sympathetic: 'increase',
    vagal: 'decrease',
    hr: 'increase',
    contractility: 'increase',
    arteriolar: 'increase',
    venous: 'increase',
  },
)

// Sabotage: the two pressure perturbations must be reciprocal at every modeled
// effector; a copied same-direction response would make the reflex non-homeostatic.
for (const key of [
  'sensorStretchDirection',
  'afferentFiringDirection',
  'sympatheticDirection',
  'vagalDirection',
  'heartRateDirection',
  'contractilityDirection',
  'arteriolarToneDirection',
  'venousToneDirection',
] as const) {
  assert.notEqual(rise[key], fall[key], `${key} must reverse with pressure perturbation`)
}

assert.equal(rise.truthClass, 'generic-physiology')
assert.equal(fall.truthClass, 'generic-physiology')
assert.throws(() => deriveBaroreflexDirection('noise' as never), /unsupported baroreflex perturbation/i)

for (const ref of ['NCBI Bookshelf NBK538172', 'PMID 24095187']) {
  assert.ok(BAROREFLEX_EVIDENCE.some((item) => item.reference === ref), `missing evidence ${ref}`)
}
for (const required of ['does not estimate a patient', 'chronic pressure resetting', 'chemoreflexes', 'renal volume control']) {
  assert.ok(BAROREFLEX_BOUNDARY.toLowerCase().includes(required.toLowerCase()), `boundary missing ${required}`)
}

console.log('baroreflex coupling: IX/X -> NTS topology and reciprocal short-term autonomic response locked')
