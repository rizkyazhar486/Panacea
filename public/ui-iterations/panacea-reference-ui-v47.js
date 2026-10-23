/* Panaceamed Reference UI v47 runtime
   Progressive enhancement only. It does not change routes, medical data,
   clinical logic, forms, or feature ownership.
*/
(() => {
  const ROOT_CLASS = 'pmd-reference-ui-v47'
  const reduceMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const finePointer = Boolean(window.matchMedia?.('(hover:hover) and (pointer:fine)').matches)
  const bound = new WeakSet()
  let refreshQueued = false

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

  const setAmbient = (index) => {
    const palettes = [
      ['37 209 98', '94 214 255'],
      ['78 141 255', '146 111 255'],
      ['255 111 157', '255 191 92'],
    ]
    const [primary, secondary] = palettes[index] ?? palettes[0]
    document.documentElement.style.setProperty('--pmd-v47-ambient-rgb', primary)
    document.documentElement.style.setProperty('--pmd-v47-ambient-2-rgb', secondary)
  }

  const bindStagePointer = (stage) => {
    if (bound.has(stage)) return
    bound.add(stage)
    if (!finePointer || reduceMotion) return

    stage.addEventListener('pointermove', (event) => {
      const box = stage.getBoundingClientRect()
      if (!box.width || !box.height) return
      const x = clamp(((event.clientX - box.left) / box.width) * 100, 0, 100)
      const y = clamp(((event.clientY - box.top) / box.height) * 100, 0, 100)
      stage.style.setProperty('--pmd-v47-glow-x', `${x.toFixed(1)}%`)
      stage.style.setProperty('--pmd-v47-glow-y', `${y.toFixed(1)}%`)
      document.documentElement.style.setProperty('--pmd-v47-pointer-x', `${x.toFixed(1)}%`)
      document.documentElement.style.setProperty('--pmd-v47-pointer-y', `${y.toFixed(1)}%`)
    }, { passive: true })
  }

  const bindPoster = (card, index) => {
    if (bound.has(card)) return
    bound.add(card)
    card.dataset.pmdV47Poster = String(index + 1)

    card.addEventListener('pointerenter', () => setAmbient(index), { passive: true })

    if (!finePointer || reduceMotion) return
    card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect()
      if (!box.width || !box.height) return
      const nx = clamp((event.clientX - box.left) / box.width, 0, 1)
      const ny = clamp((event.clientY - box.top) / box.height, 0, 1)
      const rotateY = (nx - .5) * 5.2
      const rotateX = (.5 - ny) * 5.2
      card.style.setProperty('--pmd-v47-tilt-x', `${rotateX.toFixed(2)}deg`)
      card.style.setProperty('--pmd-v47-tilt-y', `${rotateY.toFixed(2)}deg`)
      card.style.setProperty('--pmd-v47-card-x', `${(nx * 100).toFixed(1)}%`)
      card.style.setProperty('--pmd-v47-card-y', `${(ny * 100).toFixed(1)}%`)
    }, { passive: true })

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--pmd-v47-tilt-x', '0deg')
      card.style.setProperty('--pmd-v47-tilt-y', '0deg')
      card.style.setProperty('--pmd-v47-card-x', '50%')
      card.style.setProperty('--pmd-v47-card-y', '24%')
    }, { passive: true })
  }

  const apply = () => {
    document.documentElement.classList.add(ROOT_CLASS)

    document.querySelectorAll("section[aria-label='Today health brief'], section[aria-label='Panacea command deck']")
      .forEach(bindStagePointer)

    const superPages = document.querySelector("[aria-label='Super pages']")
    if (superPages) {
      superPages.querySelectorAll(':scope > button').forEach((card, index) => bindPoster(card, index))
    }

    const health = document.querySelector("section[aria-label='Today health brief']")
    if (health) health.dataset.pmdV47Dashboard = 'true'

    const command = document.querySelector("section[aria-label='Panacea command deck']")
    if (command) command.dataset.pmdV47Command = 'true'
  }

  const queueApply = () => {
    if (refreshQueued) return
    refreshQueued = true
    requestAnimationFrame(() => {
      refreshQueued = false
      apply()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true })
  } else {
    apply()
  }

  const observer = new MutationObserver(queueApply)
  observer.observe(document.documentElement, { childList: true, subtree: true })

  window.addEventListener('pageshow', queueApply, { passive: true })
})()
