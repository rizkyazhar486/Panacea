(() => {
  const VERSION = '43'
  const COPY_SELECTOR = 'p,li,dd,figcaption,span,div'
  const EXCLUDE_SELECTOR = [
    'dialog',
    '[role="dialog"]',
    '[data-pmd-unclamped="true"]',
    'details[open]',
    'nav',
    'header',
    'footer',
    'form',
    'table',
    'pre',
    'code',
    'textarea',
    '[contenteditable="true"]',
    '.sr-only',
    '#pmd-context-dialog',
    // Any descendant of a real control. Without this, a wrapping <button> or
    // <a> whose child copy is long enough gets wrapped in its own
    // role="button"/tabindex target: the click opens the interpretation
    // dialog on top of the control instead of (or as well as) activating it,
    // and the dialog then blocks every click underneath until closed.
    'button',
    'a',
    '[role="button"]',
    '[role="tab"]',
    'summary',
  ].join(',')

  const originals = new WeakMap()
  let scheduled = false
  let dialog = null
  let dialogCopy = null

  const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim()

  function isEligible(el) {
    if (!(el instanceof HTMLElement)) return false
    if (!el.closest('main')) return false
    if (el.closest(EXCLUDE_SELECTOR)) return false
    if (el.matches('button,a,input,label,select,option,summary,[role="button"],[role="tab"]')) return false

    const text = textOf(el)
    if (text.length < 48) return false

    if ((el.tagName === 'DIV' || el.tagName === 'SPAN') && el.children.length > 0) return false
    if (el.querySelector('button,a,input,select,textarea,svg,canvas,img,video')) return false
    return true
  }

  function decorate(el) {
    if (!isEligible(el) || el.dataset.pmdVisualFirst === VERSION) return
    const text = textOf(el)
    originals.set(el, text)
    el.dataset.pmdVisualFirst = VERSION
    el.dataset.pmdHasContext = 'true'
    el.classList.add('pmd-vf-copy')

    if (!el.hasAttribute('tabindex')) el.tabIndex = 0
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button')
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Open context interpretation')
    if (!el.hasAttribute('title')) el.setAttribute('title', 'Interpret')
  }

  function scan() {
    scheduled = false
    const main = document.querySelector('main')
    if (!main) return
    main.querySelectorAll(COPY_SELECTOR).forEach(decorate)
  }

  function scheduleScan() {
    if (scheduled) return
    scheduled = true
    const run = () => window.setTimeout(scan, 40)
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 350 })
    else run()
  }

  function ensureDialog() {
    if (dialog) return dialog

    dialog = document.createElement('dialog')
    dialog.id = 'pmd-context-dialog'
    dialog.setAttribute('aria-labelledby', 'pmd-context-title')
    dialog.innerHTML = `
      <div class="pmd-context-shell">
        <div class="pmd-context-head">
          <h2 id="pmd-context-title" class="pmd-context-title">Interpretation</h2>
          <button class="pmd-context-close" type="button" aria-label="Close interpretation">×</button>
        </div>
        <p class="pmd-context-copy"></p>
      </div>`
    document.body.appendChild(dialog)
    dialogCopy = dialog.querySelector('.pmd-context-copy')

    dialog.querySelector('.pmd-context-close')?.addEventListener('click', () => dialog.close())
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close()
    })
    return dialog
  }

  function openContext(el) {
    const text = originals.get(el) || textOf(el)
    if (!text) return
    const modal = ensureDialog()
    if (dialogCopy) dialogCopy.textContent = text
    if (typeof modal.showModal === 'function') modal.showModal()
    else modal.setAttribute('open', '')
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('.pmd-vf-copy[data-pmd-has-context="true"]') : null
    if (target instanceof HTMLElement) openContext(target)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const target = event.target instanceof Element ? event.target.closest('.pmd-vf-copy[data-pmd-has-context="true"]') : null
    if (!(target instanceof HTMLElement)) return
    event.preventDefault()
    openContext(target)
  })

  function scanNode(node) {
    if (!(node instanceof Element)) return
    if (node.matches?.(COPY_SELECTOR)) decorate(node)
    node.querySelectorAll?.(COPY_SELECTOR).forEach(decorate)
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(scanNode)
    }
  })

  function boot() {
    const root = document.getElementById('root') || document.body
    observer.observe(root, { childList: true, subtree: true })
    scheduleScan()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
})()
