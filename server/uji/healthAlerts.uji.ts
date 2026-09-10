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

  assert.deepEqual(events, ['deliver:start', 'deliver:done', 'commit'])
  assert.deepEqual(result, { delivered: true, stateCommitted: true })
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
  assert.deepEqual(result, { delivered: false, stateCommitted: false })
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

  assert.equal(deliveries, 1)
  assert.deepEqual(result, { delivered: true, stateCommitted: false })
}

console.log('Health-alert delivery/commit ordering verified.')
