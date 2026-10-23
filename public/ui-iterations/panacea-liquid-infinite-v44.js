/* Panaceamed Infinite Liquid OS v44 — tiny spatial interaction runtime.
   No feature/data/routing logic. Only exposes scroll/pointer state to CSS.
*/
(() => {
  const root = document.documentElement
  let raf = 0
  let lastY = Math.max(0, window.scrollY || 0)

  const updateScroll = () => {
    raf = 0
    const y = Math.max(0, window.scrollY || 0)
    root.classList.toggle('pmd-scroll-compact', y > 28)
    root.classList.toggle('pmd-scroll-near-top', y <= 28)
    root.dataset.pmdScrollDirection = y > lastY + 5 ? 'down' : y < lastY - 5 ? 'up' : 'idle'
    lastY = y
  }

  const onScroll = () => {
    if (raf) return
    raf = window.requestAnimationFrame(updateScroll)
  }

  root.classList.add('pmd-liquid-os-v44')
  updateScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!finePointer || reduceMotion || root.classList.contains('pmd-low-memory')) return

  let pointerRaf = 0
  let px = window.innerWidth / 2
  let py = 0

  const paintLens = () => {
    pointerRaf = 0
    const x = Math.max(0, Math.min(100, (px / Math.max(1, window.innerWidth)) * 100))
    const y = Math.max(0, Math.min(100, (py / Math.max(1, window.innerHeight)) * 100))
    root.style.setProperty('--pmd-lens-x', `${x.toFixed(2)}%`)
    root.style.setProperty('--pmd-lens-y', `${y.toFixed(2)}%`)
  }

  window.addEventListener('pointermove', (event) => {
    px = event.clientX
    py = event.clientY
    if (pointerRaf) return
    pointerRaf = window.requestAnimationFrame(paintLens)
  }, { passive: true })
})()
