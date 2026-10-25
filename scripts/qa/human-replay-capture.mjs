// Capture the measured Human Replay panel without Playwright's locator stability wait.
// The adjacent WebGL reference anatomy continuously animates; element screenshots
// can wait 90s for a stable layout despite a fully rendered metrics panel.
import assert from 'node:assert/strict'

export async function captureReplayMetricPanel(page, panel, path) {
  const bounds = await panel.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height }
  })
  assert.ok(Object.values(bounds).every(Number.isFinite), 'metric panel screenshot requires finite document bounds')
  assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.width >= 1 && bounds.height >= 1, 'metric panel screenshot requires nonempty on-page bounds')
  const clip = {
    x: Math.floor(bounds.x),
    y: Math.floor(bounds.y),
    width: Math.ceil(bounds.x + bounds.width) - Math.floor(bounds.x),
    height: Math.ceil(bounds.y + bounds.height) - Math.floor(bounds.y),
  }
  // Page clip captures the actual rendered pixels without scrolling the element
  // into view or waiting for an animating WebGL ancestor to become stable.
  const png = Buffer.from(await page.screenshot({ path, clip, scale: 'css', animations: 'disabled', timeout: 90000 }))
  assert.ok(png.length >= 24 && png.subarray(0, 8).toString('hex') === '89504e470d0a1a0a', 'metric panel screenshot must be a PNG')
  assert.equal(png.readUInt32BE(16), clip.width, 'metric panel screenshot width must match its clip')
  assert.equal(png.readUInt32BE(20), clip.height, 'metric panel screenshot height must match its clip')
  return { clip, pngBytes: png.length }
}
