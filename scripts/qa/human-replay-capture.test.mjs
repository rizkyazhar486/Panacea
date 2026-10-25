import assert from 'node:assert/strict'
import { test } from 'node:test'
import { captureReplayMetricPanel } from './human-replay-capture.mjs'

function png(width, height) {
  const bytes = Buffer.alloc(24)
  Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes)
  bytes.writeUInt32BE(width, 16)
  bytes.writeUInt32BE(height, 20)
  return bytes
}
function fixture(bounds, bytes = png(221, 121)) {
  const calls = []
  const panel = {
    evaluate: async () => bounds,
    screenshot: async () => { throw new Error('locator screenshot must never run: unstable WebGL ancestor') },
  }
  const page = { screenshot: async options => { calls.push(options); return bytes } }
  return { panel, page, calls }
}
test('captures document-space panel clip without locator stability wait', async () => {
  const { panel, page, calls } = fixture({ x: 12.25, y: 540.5, width: 220.1, height: 120.1 })
  const result = await captureReplayMetricPanel(page, panel, 'panel.png')
  assert.deepEqual(result.clip, { x: 12, y: 540, width: 221, height: 121 })
  assert.equal(result.pngBytes, 24)
  assert.deepEqual(calls[0], { path: 'panel.png', clip: result.clip, scale: 'css', animations: 'disabled', timeout: 90000 })
})
test('negative control: nonfinite, off-page and zero-area bounds fail before screenshot', async () => {
  for (const bounds of [
    { x: NaN, y: 0, width: 100, height: 100 },
    { x: 0, y: Infinity, width: 100, height: 100 },
    { x: -1, y: 0, width: 100, height: 100 },
    { x: 0, y: 0, width: 0, height: 100 },
  ]) {
    const { panel, page, calls } = fixture(bounds)
    await assert.rejects(captureReplayMetricPanel(page, panel, 'bad.png'), /metric panel screenshot requires/)
    assert.equal(calls.length, 0)
  }
})
test('negative control: corrupt or wrong-sized capture cannot pass as visual evidence', async () => {
  for (const bytes of [Buffer.from('not a png'), png(220, 121), png(221, 120)]) {
    const { panel, page } = fixture({ x: 12.25, y: 540.5, width: 220.1, height: 120.1 }, bytes)
    await assert.rejects(captureReplayMetricPanel(page, panel, 'bad.png'))
  }
})
