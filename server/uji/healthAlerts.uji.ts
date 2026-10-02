import assert from 'node:assert/strict'
import { deliverThenCommitAlertState } from '../src/healthAlerts.js'

{
  const events: string[] = []
  const result = await deliverThenCommitAlertState(
    async () => {
      events.push('deliver:start')
      await Promise.resolve()
      events.push('deliver:done')
    },
    () => {
      events.push('commit')
    },
  )

  assert.deepEqual(events, ['deliver:start', 'deliver:done', 'commit'], 'state must be committed only after delivery completed')
  assert.deepEqual(result, { delivered: true, stateCommitted: true }, 'successful delivery plus commit must report both true')
}

{
  let committed = false
  const result = await deliverThenCommitAlertState(
    async () => {
      throw new Error('simulated notification persistence failure')
    },
    () => {
      committed = true
    },
  )

  assert.equal(committed, false, 'failed delivery must not write cooldown/once-per-day state')
  assert.deepEqual(result, { delivered: false, stateCommitted: false }, 'failed delivery must report neither delivered nor committed')
}

{
  let deliveries = 0
  const result = await deliverThenCommitAlertState(
    async () => {
      deliveries += 1
    },
    () => {
      throw new Error('simulated settings persistence failure')
    },
  )

  assert.equal(deliveries, 1, 'a commit failure must not trigger a second delivery')
  assert.deepEqual(result, { delivered: true, stateCommitted: false }, 'commit failure after delivery must be reported as delivered but uncommitted')
}

console.log('Health-alert delivery/commit ordering verified.')
