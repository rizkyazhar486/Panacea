import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
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

// Jalankan callback evaluate yang benar-benar dipakai helper; bounds jadi
// tidak dapat membuktikan translasi dari viewport ke dokumen.
function clientRectFixture(rect, scrollX, scrollY, bytes = png(369, 241)) {
  const f = fixture(undefined, bytes)
  f.panel.evaluate = async callback => runInNewContext(`(${callback.toString()})(element)`, {
    element: { getBoundingClientRect: () => rect },
    window: { scrollX, scrollY, innerWidth: 390, innerHeight: 844 },
  })
  return f
}

test('390px: callback asli mempertahankan panel parsial dan di luar viewport pada kedua sumbu', async () => {
  const cases = [
    ['below fold', 0, 0, { left: 20.25, top: 900.5, width: 368.1, height: 240.1 }],
    ['partially visible on both axes', 80, 1000, { left: -59.75, top: -99.5, width: 368.1, height: 240.1 }],
    ['fully above viewport', 80, 1900, { left: -59.75, top: -999.5, width: 368.1, height: 240.1 }],
    ['fully left of viewport', 480, 1000, { left: -459.75, top: -99.5, width: 368.1, height: 240.1 }],
    ['fractional scroll', 80.5, 1000.25, { left: -60.25, top: -99.75, width: 368.1, height: 240.1 }],
    ['right of viewport', 0, 1000, { left: 410.25, top: -99.5, width: 368.1, height: 240.1 }],
  ]
  for (const [name, scrollX, scrollY, rect] of cases) {
    const { panel, page, calls } = clientRectFixture(rect, scrollX, scrollY)
    const result = await captureReplayMetricPanel(page, panel, 'scroll.png')
    assert.deepEqual(result.clip, { x: name === 'right of viewport' ? 410 : 20, y: 900, width: 369, height: 241 }, name)
    assert.equal(calls.length, 1, name)
    assert.equal(calls[0].fullPage, true, name)
    assert.equal(calls[0].scale, 'css', name)
  }
})

test('callback asli menolak hasil translasi di luar dokumen dan offset tidak finite sebelum capture', async () => {
  for (const [scrollX, scrollY] of [[-30, 0], [0, -1000], [NaN, 0], [0, Infinity]]) {
    const { panel, page, calls } = clientRectFixture({ left: 20.25, top: 900.5, width: 368.1, height: 240.1 }, scrollX, scrollY)
    await assert.rejects(captureReplayMetricPanel(page, panel, 'bad-scroll.png'), /metric panel screenshot requires/)
    assert.equal(calls.length, 0)
  }
})
test('captures document-space panel clip without locator stability wait', async () => {
  const { panel, page, calls } = fixture({ x: 12.25, y: 540.5, width: 220.1, height: 120.1 })
  const result = await captureReplayMetricPanel(page, panel, 'panel.png')
  assert.deepEqual(result.clip, { x: 12, y: 540, width: 221, height: 121 })
  assert.equal(result.pngBytes, 24)
  assert.deepEqual(calls[0], { path: 'panel.png', clip: result.clip, fullPage: true, scale: 'css', animations: 'disabled', timeout: 90000 })
})
test('off-viewport panel requires full-page document-space clipping (regression)', async () => {
  const { panel, calls } = fixture({ x: 12.25, y: 1540.5, width: 220.1, height: 120.1 })
  const page = {
    screenshot: async options => {
      calls.push(options)
      // Reproduce the CI failure: viewport-only page screenshot rejects a
      // document-space clip beyond a 844px-high mobile viewport.
      if (!options.fullPage && options.clip.y >= 844) {
        throw new Error('Clipped area is either empty or outside the resulting image')
      }
      return png(221, 121)
    },
  }
  const result = await captureReplayMetricPanel(page, panel, 'below-fold.png')
  assert.equal(result.clip.y, 1540)
  assert.equal(calls[0].fullPage, true)
  assert.equal(result.pngBytes, 24)
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
