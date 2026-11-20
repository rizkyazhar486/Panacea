import assert from 'node:assert/strict'

let sequence = 0
const budgetMs = 90_000
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex')

// Navigasi keyboard memindahkan viewport. Kembalikan asal capture dan beri
// observer/render dua frame sebelum membaca seluruh halaman, tanpa menyembunyikan kanvas.
export async function captureReplayScreenshot(page, path, { now = () => performance.now() } = {}) {
  const started = now()
  const ready = await page.waitForFunction(id => {
    const canvas = document.querySelector('section canvas')
    if (!canvas) return false
    const geometry = () => {
      const box = canvas.getBoundingClientRect()
      return { scrollX: window.scrollX, scrollY: window.scrollY, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
        canvas: { x: box.x, y: box.y, width: box.width, height: box.height } }
    }
    if (window.__replayCapture?.id !== id) {
      window.__replayCapture = { id, frames: 0, before: geometry() }
      window.scrollTo({ left: 0, top: 0, behavior: 'instant' })
      return false
    }
    const after = geometry()
    if (after.scrollX !== 0 || after.scrollY !== 0 || after.canvas.width <= 0 || after.canvas.height <= 0
      || after.canvas.x >= after.viewportWidth || after.canvas.x + after.canvas.width <= 0
      || after.canvas.y >= after.viewportHeight || after.canvas.y + after.canvas.height <= 0) return false
    window.__replayCapture.frames += 1
    return window.__replayCapture.frames >= 2 ? { before: window.__replayCapture.before, after } : false
  }, ++sequence, { polling: 'raf', timeout: budgetMs })
  let geometry
  try { geometry = await ready.jsonValue() } finally { await ready.dispose() }
  const remaining = budgetMs - Math.ceil(now() - started)
  assert.ok(remaining > 0, 'Human Replay screenshot exhausted its capture budget during preparation')
  console.info('Human Replay capture geometry:', JSON.stringify(geometry))
  const png = await page.screenshot({ path, fullPage: true, animations: 'disabled', timeout: remaining })
  assert.ok(Buffer.isBuffer(png) && png.length >= 45 && png.subarray(0, 8).equals(pngSignature)
    && png.toString('ascii', 12, 16) === 'IHDR' && png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0
    && png.toString('ascii', png.length - 8, png.length - 4) === 'IEND', 'Human Replay screenshot must produce a nonempty PNG')
  return { ...geometry, pngBytes: png.length, pngWidth: png.readUInt32BE(16), pngHeight: png.readUInt32BE(20) }
}
