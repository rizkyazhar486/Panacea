import assert from 'node:assert/strict'
import { createBodyRenderScheduler } from '../../src/lib/bodyRenderScheduler.ts'

let renderable = true
let renderCount = 0
let nextFrameId = 1
const pending = new Map<number, () => void>()
const cancelled: number[] = []

const scheduler = createBodyRenderScheduler({
  canRender: () => renderable,
  renderFrame: () => { renderCount += 1 },
  requestFrame: (callback) => {
    const id = nextFrameId
    nextFrameId += 1
    pending.set(id, callback)
    return id
  },
  cancelFrame: (id) => {
    cancelled.push(id)
    pending.delete(id)
  },
})

function flushOne() {
  const entry = pending.entries().next().value as [number, () => void] | undefined
  assert.ok(entry, 'expected a scheduled render frame')
  pending.delete(entry[0])
  entry[1]()
}

scheduler.request()
scheduler.request()
assert.equal(pending.size, 1, 'bursty invalidations must collapse into one frame')
flushOne()
assert.equal(renderCount, 1)
assert.equal(pending.size, 0, 'a completed frame must not create an idle render loop')

renderable = false
scheduler.request()
assert.equal(pending.size, 0, 'hidden or offscreen renderers must not schedule work')

renderable = true
scheduler.request()
assert.equal(pending.size, 1)
renderable = false
flushOne()
assert.equal(renderCount, 1, 'a renderer hidden before its callback runs must skip drawing')

renderable = true
scheduler.request()
const scheduledBeforeStop = pending.keys().next().value as number
scheduler.stop()
assert.deepEqual(cancelled, [scheduledBeforeStop])
assert.equal(pending.size, 0)

scheduler.request()
assert.equal(pending.size, 1)
scheduler.dispose()
assert.equal(pending.size, 0)
scheduler.request()
assert.equal(pending.size, 0, 'disposed renderers must ignore later invalidations')


let zeroIdScheduleCount = 0
const zeroIdCancelled: number[] = []
const zeroIdScheduler = createBodyRenderScheduler({
  canRender: () => true,
  renderFrame: () => {},
  requestFrame: () => {
    zeroIdScheduleCount += 1
    return 0
  },
  cancelFrame: (id) => { zeroIdCancelled.push(id) },
})

zeroIdScheduler.request()
zeroIdScheduler.request()
assert.equal(zeroIdScheduleCount, 1, 'frame id zero must still coalesce duplicate invalidations')
assert.equal(zeroIdScheduler.hasPendingFrame(), true, 'frame id zero must be tracked as pending')
zeroIdScheduler.stop()
assert.deepEqual(zeroIdCancelled, [0], 'frame id zero must remain cancellable')
assert.equal(zeroIdScheduler.hasPendingFrame(), false)

console.log('body render scheduler: coalesces invalidations and stays idle while hidden, offscreen, or disposed')
