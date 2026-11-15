/**
 * Blocks below the hero render only as they near the viewport and hold an estimated height until then
 * (RenderWhenNear), so a smooth in-page scroll aims at where its target was before the blocks it passes had rendered.
 * Once the scroll stops, those blocks have their real heights; line the target up again with one instant scroll.
 *
 * "Stopped" is whichever comes first: the `scrollend` event, or the position holding for `settleMs` — `scrollend` is
 * missing in some browsers and was not always delivered in testing. Nothing is realigned if the reader takes over
 * (wheel, touch, pointer or key), or if nothing has scrolled within `noScrollMs` (the target was already in place).
 * Returns a function that cancels the pending realignment.
 */
export function alignWhenScrollStops(target: Element, win: Window = window, settleMs = 150, noScrollMs = 600): () => void {
  const takeover = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
  const TICK = 50
  const SAFETY_MS = 15000
  const startY = win.scrollY
  let lastY = startY
  let moved = false
  let still = 0
  let elapsed = 0
  let done = false
  const stop = () => {
    if (done) return
    done = true
    win.removeEventListener('scrollend', align)
    for (const name of takeover) win.removeEventListener(name, stop)
    win.clearInterval(poll)
  }
  function align() {
    if (done) return
    stop()
    target.scrollIntoView({ behavior: 'instant', block: 'start' })
  }
  for (const name of takeover) win.addEventListener(name, stop, { passive: true })
  win.addEventListener('scrollend', align)
  const poll = win.setInterval(() => {
    elapsed += TICK
    const y = win.scrollY
    if (y !== startY) moved = true
    still = y === lastY ? still + TICK : 0
    lastY = y
    if (!moved && elapsed >= noScrollMs) stop()
    else if (moved && still >= settleMs) align()
    else if (elapsed >= SAFETY_MS) stop()
  }, TICK)
  return stop
}
