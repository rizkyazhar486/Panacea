import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { captureReplayScreenshot } from './replay-screenshot.mjs'

// PNG 1×1 sintetis; bukan screenshot produk atau bukti render WebGL.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=', 'base64')
function fixture({ scrollWorks = true, canvasPresent = true, canvasX = 0, canvasY = 438, canvasWidth = 390, canvasHeight = 500, image = png, screenshotError } = {}) {
  const calls = []
  const window = { scrollX: 0, scrollY: 900, innerWidth: 390, innerHeight: 844,
    scrollTo(options) { calls.push(['scroll', options]); if (scrollWorks) { this.scrollX = options.left; this.scrollY = options.top } } }
  const document = { querySelector: selector => {
    assert.equal(selector, 'section canvas')
    return canvasPresent ? { getBoundingClientRect: () => ({ x: canvasX, y: canvasY - window.scrollY, width: canvasWidth, height: canvasHeight }) } : null
  } }
  const page = {
    async waitForFunction(predicate, id, options) {
      assert.deepEqual(options, { polling: 'raf', timeout: 90_000 })
      let value
      for (let frame = 0; frame < 3; frame++) {
        calls.push(['frame', frame])
        value = vm.runInNewContext(`(${predicate.toString()})(id)`, { window, document, id })
        if (value) break
      }
      if (!value) throw new Error('capture origin/visible canvas did not settle')
      return { jsonValue: async () => JSON.parse(JSON.stringify(value)), dispose: async () => { calls.push(['disposed']) } }
    },
    async screenshot(options) {
      calls.push(['screenshot', options])
      assert.equal(window.scrollY, 0, 'capture must restore the viewport before screenshot')
      assert.equal(window.__replayCapture.frames, 2, 'capture must wait for two frames after scrolling')
      if (screenshotError) throw screenshotError
      return image
    },
  }
  return { page, calls, window }
}

test('capture memulihkan asal viewport, tunggu dua frame, simpan PNG penuh dan geometri', async () => {
  const { page, calls } = fixture()
  const result = await captureReplayScreenshot(page, 'mixed-390.png', { now: () => 0 })
  assert.equal(result.before.scrollY, 900)
  assert.equal(result.after.scrollY, 0)
  assert.equal(result.after.canvas.y, 438)
  assert.equal(result.pngBytes, png.length)
  assert.equal(result.pngWidth, 1)
  assert.equal(result.pngHeight, 1)
  assert.deepEqual(calls.map(c => c[0]), ['frame', 'scroll', 'frame', 'frame', 'disposed', 'screenshot'])
  assert.deepEqual(calls.at(-1)[1], { path: 'mixed-390.png', fullPage: true, animations: 'disabled', timeout: 90_000 })
})

test('gagal memulihkan scroll menolak capture tanpa screenshot', async () => {
  const { page, calls } = fixture({ scrollWorks: false })
  await assert.rejects(captureReplayScreenshot(page, 'fail.png'), /capture origin\/visible canvas did not settle/)
  assert.equal(calls.some(c => c[0] === 'screenshot'), false)
})

test('capture berikutnya memulai ulang barrier setelah viewport bergeser lagi', async () => {
  const { page, calls, window } = fixture()
  await captureReplayScreenshot(page, 'unknown.png')
  window.scrollY = 700
  const next = await captureReplayScreenshot(page, 'mixed.png')
  assert.equal(next.before.scrollY, 700)
  assert.equal(next.after.scrollY, 0)
  assert.equal(calls.filter(c => c[0] === 'scroll').length, 2)
  assert.equal(calls.filter(c => c[0] === 'screenshot').length, 2)
})

test('kanvas hilang menolak capture tanpa screenshot', async () => {
  const { page, calls } = fixture({ canvasPresent: false })
  await assert.rejects(captureReplayScreenshot(page, 'fail.png'), /capture origin\/visible canvas did not settle/)
  assert.equal(calls.some(c => c[0] === 'screenshot'), false)
})

test('kanvas kosong atau di luar viewport tidak menjadi bukti capture', async () => {
  for (const options of [{ canvasX: 390 }, { canvasX: -390 }, { canvasY: 900 }, { canvasY: -500 }, { canvasWidth: 0 }, { canvasHeight: 0 }]) {
    const { page, calls } = fixture(options)
    await assert.rejects(captureReplayScreenshot(page, 'fail.png'), /capture origin\/visible canvas did not settle/)
    assert.equal(calls.some(c => c[0] === 'screenshot'), false)
  }
})

test('timeout screenshot tetap menggagalkan gate', async () => {
  const failure = new Error('synthetic screenshot timeout')
  const { page } = fixture({ screenshotError: failure })
  await assert.rejects(captureReplayScreenshot(page, 'fail.png'), error => error === failure)
})

test('PNG kosong, rusak dan terpotong ditolak', async () => {
  const noWidth = Buffer.from(png); noWidth.writeUInt32BE(0, 16)
  const noHeight = Buffer.from(png); noHeight.writeUInt32BE(0, 20)
  const badHeader = Buffer.from(png); badHeader[12] = 0
  const badEnd = Buffer.from(png); badEnd[badEnd.length - 8] = 0
  for (const image of [Buffer.alloc(0), Buffer.alloc(64), png.subarray(0, 32), noWidth, noHeight, badHeader, badEnd, 'not-a-buffer']) {
    const { page } = fixture({ image })
    await assert.rejects(captureReplayScreenshot(page, 'fail.png'), /must produce a nonempty PNG/)
  }
})

test('persiapan memakai budget 90 detik yang sama dengan screenshot', async () => {
  const { page, calls } = fixture()
  const times = [0, 12_345.1]
  await captureReplayScreenshot(page, 'budget.png', { now: () => times.shift() })
  assert.equal(calls.at(-1)[1].timeout, 77_654)
})

test('budget habis menghentikan capture tanpa menaikkan timeout', async () => {
  const { page, calls } = fixture()
  const times = [0, 90_000]
  await assert.rejects(captureReplayScreenshot(page, 'fail.png', { now: () => times.shift() }), /exhausted its capture budget/)
  assert.equal(calls.some(c => c[0] === 'screenshot'), false)
})
