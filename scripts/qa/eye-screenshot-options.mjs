import assert from 'node:assert/strict'

// boundingBox is viewport-relative; fullPage clips use document coordinates.
export function eyeScreenshotOptions(box, scroll) {
  assert.ok(box && scroll, 'Eye capture requires a box and scroll offset')
  const clip = { x: box.x + scroll.x, y: box.y + scroll.y, width: box.width, height: box.height }
  assert.ok(Object.values(clip).every(Number.isFinite), 'Eye capture coordinates must be finite')
  assert.ok(clip.x >= 0 && clip.y >= 0 && clip.width > 0 && clip.height > 0, 'Eye capture rectangle must be visible in the document')
  return { fullPage: true, clip }
}
