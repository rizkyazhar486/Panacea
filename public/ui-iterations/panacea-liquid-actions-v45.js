/* Panaceamed Liquid Action Engine v45
   Universal progressive interaction layer inspired by the timer/control-center
   behavior supplied by the product owner. It never owns feature logic: existing
   React handlers, forms, toggles and routes remain authoritative.
*/
(() => {
  const root = document.documentElement
  const reduceMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const lowMemory = root.classList.contains('pmd-low-memory') || Boolean(window.__PANACEA_LOW_MEMORY__)
  const ACTION_SELECTOR = [
    'button',
    'a[href]',
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
  ].join(',')

  const isElement = (value) => value instanceof Element

  const isEligible = (element) => {
    if (!(element instanceof HTMLElement)) return false
    if (!element.matches(ACTION_SELECTOR)) return false
    if (element.closest('[data-pmd-liquid="off"]')) return false
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') return false
    return true
  }

  const labelOf = (element) => {
    if (!(element instanceof HTMLElement)) return ''
    const explicit = element.getAttribute('aria-label') || element.getAttribute('title')
    if (explicit) return explicit.trim().replace(/\s+/g, ' ').slice(0, 72)
    if (element instanceof HTMLInputElement) return String(element.value || element.name || 'Action').trim().slice(0, 72)
    const text = String(element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ')
    return (text || 'Action').slice(0, 72)
  }

  const syncState = (element) => {
    if (!(element instanceof HTMLElement)) return
    const expanded = element.getAttribute('aria-expanded') === 'true'
    const pressed = element.getAttribute('aria-pressed') === 'true'
    element.classList.toggle('pmd-liquid-expanded', expanded)
    element.classList.toggle('pmd-liquid-selected', pressed)
  }

  const mark = (element) => {
    if (!isEligible(element)) return
    if (!element.hasAttribute('data-pmd-liquid-action')) element.setAttribute('data-pmd-liquid-action', '')
    syncState(element)
  }

  const scan = (scope = document) => {
    if (scope instanceof Element && scope.matches(ACTION_SELECTOR)) mark(scope)
    scope.querySelectorAll?.(ACTION_SELECTOR).forEach(mark)
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const pressLayer = document.createElement('div')
  pressLayer.id = 'pmd-liquid-press-layer'
  pressLayer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(pressLayer)

  const morph = document.createElement('div')
  morph.id = 'pmd-liquid-morph-layer'
  morph.setAttribute('aria-hidden', 'true')
  morph.innerHTML = '<span class="pmd-liquid-morph-orb"></span><span class="pmd-liquid-morph-label"></span><span class="pmd-liquid-morph-trace"></span>'
  document.body.appendChild(morph)

  const morphLabel = morph.querySelector('.pmd-liquid-morph-label')
  let morphTimer = 0

  const showPress = (_event, _element) => {
    // Disabled: over-the-top ripple effect removed for calm, professional clinical UX
  }

  const showMorph = (_element) => {
    // Disabled: disruptive floating morph capsule that obstructed UI on click
  }

  const release = (element) => {
    if (!(element instanceof HTMLElement)) return
    window.setTimeout(() => element.classList.remove('pmd-liquid-pressed'), 120)
  }

  document.addEventListener('pointerdown', (event) => {
    if (!isElement(event.target)) return
    const element = event.target.closest(ACTION_SELECTOR)
    if (!isEligible(element)) return
    mark(element)
    element.classList.add('pmd-liquid-pressed')
    const rect = element.getBoundingClientRect()
    const px = clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100, 0, 100)
    const py = clamp(((event.clientY - rect.top) / Math.max(1, rect.height)) * 100, 0, 100)
    element.style.setProperty('--pmd-action-x', `${px.toFixed(2)}%`)
    element.style.setProperty('--pmd-action-y', `${py.toFixed(2)}%`)
  }, { capture: true, passive: true })

  document.addEventListener('pointerup', (event) => {
    if (!isElement(event.target)) return
    const element = event.target.closest(ACTION_SELECTOR)
    if (element) release(element)
  }, { capture: true, passive: true })

  document.addEventListener('pointercancel', (event) => {
    if (!isElement(event.target)) return
    const element = event.target.closest(ACTION_SELECTOR)
    if (element) release(element)
  }, { capture: true, passive: true })

  document.addEventListener('click', (event) => {
    if (!isElement(event.target)) return
    const element = event.target.closest(ACTION_SELECTOR)
    if (!isEligible(element)) return
    mark(element)
    window.requestAnimationFrame(() => syncState(element))
  }, { capture: true })

  document.addEventListener('focusin', (event) => {
    if (!isElement(event.target)) return
    const element = event.target.closest(ACTION_SELECTOR)
    if (!isEligible(element)) return
    mark(element)
    element.classList.add('pmd-liquid-focus')
  })

  document.addEventListener('focusout', (event) => {
    if (!isElement(event.target)) return
    const element = event.target.closest(ACTION_SELECTOR)
    element?.classList.remove('pmd-liquid-focus')
  })

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        const element = record.target
        if (element instanceof HTMLElement && element.matches(ACTION_SELECTOR)) {
          mark(element)
          syncState(element)
        }
        continue
      }
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) scan(node)
      })
    }
  })

  const start = () => {
    root.classList.add('pmd-liquid-actions-v45')
    scan(document)
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-expanded', 'aria-pressed', 'aria-disabled', 'disabled'],
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
})()
