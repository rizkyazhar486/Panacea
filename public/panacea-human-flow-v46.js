/* Panacea v46 — Human Flow Runtime
   Additive UX enhancement. No medical inference, routing, or clinical state
   is modified here. Meaning is taken only from labels already present in DOM. */
(() => {
  'use strict'

  if (window.PanaceaHumanFlow?.version === '46.0.0') return

  const VERSION = '46.0.0'
  const ROOT = document.documentElement
  const EXCLUDED_ICON_NAMES = /^(close|dismiss|back|menu|more|search|previous|next|tutup|kembali|menu|lainnya|cari|sebelumnya|berikutnya)$/i
  const CONTROL_SELECTOR = 'button, a[href], [role="button"]'
  const FIELD_SELECTOR = 'input, textarea, select'
  let uid = 0
  let scheduled = false

  const nextId = (prefix = 'pmd') => `${prefix}-${++uid}`

  const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim()

  const humanizeToken = (value) => {
    const clean = normalizeWhitespace(value)
    if (!clean) return ''
    if (!/[_-]|[a-z][A-Z]/.test(clean)) return clean
    const spaced = clean
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
    return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : ''
  }

  const directText = (el) => {
    if (!(el instanceof Element)) return ''
    return normalizeWhitespace(
      Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join(' '),
    )
  }

  const accessibleLabel = (el) => {
    if (!(el instanceof HTMLElement)) return ''
    const explicit = el.dataset.pmdHumanLabel
    const aria = el.getAttribute('aria-label')
    const title = el.getAttribute('title')
    const value = explicit || aria || title || ''
    return humanizeToken(value)
  }

  const visuallyIconOnly = (el) => {
    if (!(el instanceof HTMLElement)) return false
    if (directText(el)) return false
    if (el.querySelector('.pmd-control-label')) return false
    const hasVisual = Boolean(el.querySelector('svg, img, [class*="icon"], [data-icon], i'))
    return hasVisual || Boolean(el.getAttribute('aria-label') || el.getAttribute('title'))
  }

  const enhanceIconControl = (el) => {
    if (!(el instanceof HTMLElement)) return
    if (el.dataset.pmdHumanized === 'true' || el.dataset.pmdHumanFlow === 'off') return
    if (!visuallyIconOnly(el)) return

    const label = accessibleLabel(el)
    if (!label || EXCLUDED_ICON_NAMES.test(label)) return

    const span = document.createElement('span')
    span.className = 'pmd-control-label'
    span.textContent = label
    span.setAttribute('aria-hidden', 'true')
    el.appendChild(span)
    el.classList.add('pmd-icon-labeled')
    el.dataset.pmdHumanized = 'true'
  }

  const markPrimaryAction = (form) => {
    if (!(form instanceof HTMLFormElement)) return
    const actions = Array.from(
      form.querySelectorAll('button[type="submit"], input[type="submit"], [data-pmd-primary-action="true"]'),
    ).filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true')
    if (!actions.length) return
    const primary = actions[actions.length - 1]
    primary.classList.add('pmd-primary-cta')
    primary.dataset.pmdPrimaryAction = 'true'
  }

  const describedByTokens = (field) =>
    normalizeWhitespace(field.getAttribute('aria-describedby')).split(' ').filter(Boolean)

  const clearError = (field) => {
    if (!(field instanceof HTMLElement)) return
    const errorId = field.dataset.pmdErrorId
    if (errorId) {
      document.getElementById(errorId)?.remove()
      const remaining = describedByTokens(field).filter((id) => id !== errorId)
      if (remaining.length) field.setAttribute('aria-describedby', remaining.join(' '))
      else field.removeAttribute('aria-describedby')
    }
    field.removeAttribute('aria-invalid')
    delete field.dataset.pmdErrorId
  }

  const errorMessageFor = (field) => {
    const explicit = normalizeWhitespace(field.dataset.pmdErrorMessage)
    if (explicit) return explicit
    if ('validationMessage' in field && field.validationMessage) return normalizeWhitespace(field.validationMessage)
    return 'Please check this field and try again.'
  }

  const showError = (field) => {
    if (!(field instanceof HTMLElement)) return
    if (field.dataset.pmdHumanFlow === 'off') return

    clearError(field)
    const message = errorMessageFor(field)
    const error = document.createElement('div')
    const id = nextId('pmd-field-error')
    error.id = id
    error.className = 'pmd-field-error'
    error.setAttribute('role', 'alert')
    error.textContent = message

    field.dataset.pmdErrorId = id
    field.setAttribute('aria-invalid', 'true')
    const described = describedByTokens(field)
    if (!described.includes(id)) described.push(id)
    field.setAttribute('aria-describedby', described.join(' '))

    const wrapper = field.closest('[data-pmd-field], .field, .form-field, .input-group')
    ;(wrapper || field.parentElement || field).appendChild(error)
  }

  const enhanceForm = (form) => {
    if (!(form instanceof HTMLFormElement)) return
    if (form.dataset.pmdHumanFlow === 'off') return
    if (!form.dataset.pmdHumanFlow) form.dataset.pmdHumanFlow = 'true'
    markPrimaryAction(form)
  }

  const updateProgress = (container, current, total, label) => {
    if (!(container instanceof HTMLElement)) return false
    const safeTotal = Math.max(1, Number(total) || 1)
    const safeCurrent = Math.min(safeTotal, Math.max(0, Number(current) || 0))
    const percent = Math.round((safeCurrent / safeTotal) * 100)

    container.dataset.pmdProgress = 'true'
    container.dataset.pmdStep = String(safeCurrent)
    container.dataset.pmdTotal = String(safeTotal)
    container.style.setProperty('--pmd-progress', String(percent))
    container.setAttribute('role', 'progressbar')
    container.setAttribute('aria-valuemin', '0')
    container.setAttribute('aria-valuemax', String(safeTotal))
    container.setAttribute('aria-valuenow', String(safeCurrent))

    let meta = container.querySelector(':scope > .pmd-progress-meta')
    if (!meta) {
      meta = document.createElement('div')
      meta.className = 'pmd-progress-meta'
      container.prepend(meta)
    }

    const humanLabel = normalizeWhitespace(label || container.dataset.pmdProgressLabel)
    meta.textContent = humanLabel || `Step ${safeCurrent} of ${safeTotal}`

    let track = container.querySelector(':scope > .pmd-progress-track')
    if (!track) {
      track = document.createElement('div')
      track.className = 'pmd-progress-track'
      track.setAttribute('aria-hidden', 'true')
      const value = document.createElement('div')
      value.className = 'pmd-progress-value'
      track.appendChild(value)
      container.appendChild(track)
    }
    return true
  }

  const enhanceProgress = (root) => {
    const containers = []
    if (root instanceof HTMLElement && root.hasAttribute('data-pmd-progress')) containers.push(root)
    if (root?.querySelectorAll) containers.push(...root.querySelectorAll('[data-pmd-progress]'))

    for (const container of containers) {
      const current = container.dataset.pmdStep
      const total = container.dataset.pmdTotal
      if (current == null || total == null) continue
      updateProgress(container, current, total)
    }
  }

  const applyHumanLabel = (el) => {
    if (!(el instanceof HTMLElement)) return
    const human = normalizeWhitespace(el.dataset.pmdHumanLabel)
    if (!human) return

    if (el.matches('input[type="button"], input[type="submit"]')) {
      el.value = human
      return
    }

    if (el.matches(CONTROL_SELECTOR) && !directText(el)) {
      el.setAttribute('aria-label', human)
    }
  }

  const refresh = (root = document) => {
    if (!root) return

    if (root instanceof HTMLElement) applyHumanLabel(root)
    root.querySelectorAll?.('[data-pmd-human-label]').forEach(applyHumanLabel)

    if (root instanceof HTMLFormElement) enhanceForm(root)
    root.querySelectorAll?.('form').forEach(enhanceForm)

    if (root instanceof HTMLElement && root.matches(CONTROL_SELECTOR)) enhanceIconControl(root)
    root.querySelectorAll?.(CONTROL_SELECTOR).forEach(enhanceIconControl)

    enhanceProgress(root)
    ROOT.dataset.pmdHumanFlowVersion = VERSION
  }

  const scheduleRefresh = () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      refresh(document)
    })
  }

  document.addEventListener(
    'invalid',
    (event) => {
      const field = event.target
      if (!(field instanceof HTMLElement) || !field.matches(FIELD_SELECTOR)) return
      showError(field)
      requestAnimationFrame(() => {
        if (typeof field.focus === 'function') field.focus({ preventScroll: true })
        field.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
      })
    },
    true,
  )

  const clearIfValid = (event) => {
    const field = event.target
    if (!(field instanceof HTMLElement) || !field.matches(FIELD_SELECTOR)) return
    if ('validity' in field && field.validity?.valid) clearError(field)
  }

  document.addEventListener('input', clearIfValid, true)
  document.addEventListener('change', clearIfValid, true)

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === 'childList' && mutation.addedNodes.length)) {
      scheduleRefresh()
    }
  })

  const start = () => {
    refresh(document)
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true })
  }

  window.PanaceaHumanFlow = Object.freeze({
    version: VERSION,
    refresh,
    setProgress(target, current, total, label = '') {
      const container = typeof target === 'string' ? document.querySelector(target) : target
      return updateProgress(container, current, total, label)
    },
    clearErrors(target = document) {
      const fields = []
      if (target instanceof HTMLElement && target.matches(FIELD_SELECTOR)) fields.push(target)
      target.querySelectorAll?.(`${FIELD_SELECTOR}[aria-invalid="true"]`).forEach((field) => fields.push(field))
      fields.forEach(clearError)
    },
  })

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
})()
