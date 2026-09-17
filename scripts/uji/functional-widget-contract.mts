import assert from 'node:assert/strict'
import {
  auditFunctionalWidget,
  createInlineTimerWidgetSpec,
} from '../../src/lib/functionalWidgetContract.ts'

const timer = auditFunctionalWidget(createInlineTimerWidgetSpec('home-timer', '/sleep-toolkit'))
assert.equal(timer.functionalCoverageFraction, 1)
assert.equal(timer.actionableControlCount, timer.interactiveControlCount)
assert.equal(timer.deadControlIds.length, 0)
assert.equal(timer.primaryFunctionWithinTwoSteps, true)
assert.equal(timer.pass, true)

const dead = auditFunctionalWidget({
  id: 'dead-widget',
  title: 'Dead widget',
  surface: 'home',
  hasInlineState: false,
  progressiveDisclosure: true,
  maxInteractionsToPrimaryFunction: 2,
  actions: [
    { id: 'fake', label: 'Fake', kind: 'refresh', changesState: false, producesFeedback: false, decorativeOnly: false },
    { id: 'open', label: 'Open', kind: 'navigate', changesState: false, producesFeedback: true, decorativeOnly: false },
  ],
})
assert.equal(dead.functionalCoverageFraction, 0)
assert.deepEqual(dead.deadControlIds.sort(), ['fake','open'])
assert.equal(dead.pass, false)

assert.throws(() => auditFunctionalWidget({
  id: 'external', title: 'External', surface: 'home', hasInlineState: false, progressiveDisclosure: true, maxInteractionsToPrimaryFunction: 1,
  actions: [{ id: 'go', label: 'Go', kind: 'navigate', targetRoute: 'https://example.com', changesState: false, producesFeedback: true, decorativeOnly: false }],
}), /internal app route/)

console.log('Functional widget contract verified: every interactive-looking control must navigate or change state, produce feedback, support progressive disclosure, and keep the primary function within two interactions.')
